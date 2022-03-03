import { morphdom, toElement } from '../morphdom';
import { EventEmitter } from '../observables/event_emitter';
import { StateSubject } from '../observables/state_subject';
import { HTMLTemplate } from '../types';
import { CustomElement } from '../types/custom-element';
import { coerceArray } from '../utils';
import { addEventListener } from '../utils/add-event-listener';
import { HTMLResult } from './html-result';

type AttrBind =
  | {
      attr: string;
      data: Function | EventEmitter<any>;
      listener: () => void;
      type: 'event';
    }
  | {
      attr: string;
      data: any;
      type: 'prop';
    }
  | {
      attr: 'ref';
      data: StateSubject<any>;
      type: 'ref';
    };

const ELEMENT_ATTRIBUTES = new Map<Element, AttrBind[]>();
const ELEMENT_KEYS = new Map<Element, string>();

// TODO: allow prop binding for non Custom Element
const bindProp = (el: Element, propName: string, value: any) => {
  const prop = (el as CustomElement)._elementRef.properties.props?.[propName];
  if (prop instanceof StateSubject) {
    prop.next(value);
  } else {
    console.error(
      `Bind Error! Can't find "${propName}" property as instance of StateSubject on "${el.localName}".`
    );
  }
};

const getHooks = (element: any) => {
  const hooks = (element._hooks ??= {});
  hooks.effect ??= {};
  hooks.state ??= [];
  hooks.index = 0;

  const useState = (initialValue: any) => {
    const cachedIndex = hooks.index;
    if (!hooks.state[cachedIndex]) {
      hooks.state[cachedIndex] = initialValue;
    }
    const state = hooks.state[cachedIndex];
    const setter = (newValue: any) => {
      hooks.state[cachedIndex] = newValue;
    };
    hooks.index++;
    return [state, setter];
  };

  const useEffect = (callback: () => void | (() => void), dependencies: any[]) => {
    const cachedIndex = hooks.index;
    const hasChanged = dependencies.some(
      (dep, i) => dep !== hooks.state[cachedIndex]?.[i]
    );
    if (dependencies === undefined || hasChanged) {
      hooks.effect[cachedIndex]?.();
      const effect = callback();
      hooks.effect[cachedIndex] = effect;
      hooks.state[cachedIndex] = dependencies;
    }
    hooks.index++;
  };

  return { useState, useEffect };
};

export function render(
  template: HTMLTemplate | HTMLTemplate[] | null | undefined,
  element: HTMLElement | DocumentFragment
): void | ((element: HTMLElement | DocumentFragment) => void) {
  const args: any[] = [];
  const html = coerceArray(template)
    .map(item => HTMLResult.create(item).render(args))
    .join();
  const root = toElement(`<div>${html}</div>`) as HTMLElement;
  const hooks = getHooks(element);

  // directive bind
  args.forEach((arg, i) => {
    if (typeof arg === 'function') {
      const template = root.querySelector(`template#_${i}`);
      const startRef = document.createComment('');
      const endRef = document.createComment('');
      template?.replaceWith(startRef, endRef);

      const renderContent = (content: any) => {
        const parent = startRef.parentElement;
        const template = document.createElement('template');
        if (content !== null && content !== undefined) {
          render(content, template);
        }

        if (parent) {
          const clone = parent.cloneNode(true);
          const parentChildren = Array.from(parent.childNodes);
          const startIndex = parentChildren.indexOf(startRef);
          const endIndex = parentChildren.indexOf(endRef);

          Array.from(clone.childNodes)
            .slice(startIndex + 1, endIndex)
            .forEach(node => node.remove());

          template.childNodes.forEach((node, i) =>
            clone.insertBefore(node, clone.childNodes.item(startIndex + i + 1))
          );
          morphdom(parent, clone, { childrenOnly: true });
        }
      };

      arg(renderContent, hooks);
    }
  });

  // patch changes
  morphdom(element, root, {
    childrenOnly: true,
    getNodeKey(node) {
      const el = node as Element;
      const attr = el.getAttribute?.('key');
      const key = ELEMENT_KEYS.get(el);
      return attr ?? key ?? el.id;
    },
    onBeforeElUpdated(fromEl, toEl) {
      const elAttrs = ELEMENT_ATTRIBUTES.get(fromEl);
      if (!elAttrs) {
        return true;
      }

      elAttrs.forEach(bind => {
        const attr = toEl.attributes.getNamedItem(bind.attr);

        if (attr) {
          const arg = args[Number(attr?.value)];
          const nextValue = arg instanceof StateSubject ? arg() : arg;
          const lastValue = bind.data;

          if (nextValue !== lastValue) {
            bind.data = nextValue;

            switch (bind.type) {
              case 'event':
                bind.listener();
                const eventName = attr.name.replace('on:', '');
                bind.listener = addEventListener(fromEl, eventName, arg);
                break;
              case 'ref':
                bind.data.next(fromEl);

                break;
              case 'prop':
                const propName = attr.name.slice(1);
                bindProp(fromEl, propName, nextValue);
                break;
            }
          }
        } else {
          // TODO: it means that we don't bind that attr anymore, should remove binding
        }
      });

      // TODO: add new bindings from toEl

      return true;
    },
    onNodeAdded(node) {
      const binds: AttrBind[] = [];

      const el = node as Element;
      const key = el.getAttribute?.('key');
      const ref = el.getAttribute?.('ref');

      if (key) {
        ELEMENT_KEYS.set(el, key);
        el.removeAttribute('key');
      }

      if (ref) {
        const arg = args[Number(ref)];
        if (arg instanceof StateSubject) {
          arg.next(el);
        } else if (typeof arg === 'function') {
          arg(el);
        } else {
          console.error('Bind error! Could not bind ref attribute.');
        }
        el.removeAttribute('ref');
      }

      Array.from(el.attributes ?? []).forEach(attr => {
        // bind event listeners
        if (attr.name.startsWith('on:')) {
          const arg = args[Number(attr.value)];
          const eventName = attr.name.replace('on:', '');
          const listener = addEventListener(el, eventName, arg);
          el.removeAttribute(attr.name);
          binds.push({
            attr: attr.name,
            data: arg,
            listener,
            type: 'event',
          });
        }

        // bind props
        if (attr.name.startsWith(':')) {
          const arg = args[Number(attr.value)];
          const value = arg instanceof StateSubject ? arg() : arg;
          const propName = attr.name.slice(1);
          bindProp(el, propName, value);
          el.removeAttribute(attr.name);
          binds.push({
            attr: attr.name,
            data: value,
            type: 'prop',
          });
        }
      });

      if (binds.length > 0) {
        const elAttrs = ELEMENT_ATTRIBUTES.get(el) ?? [];
        elAttrs.push(...binds);
        ELEMENT_ATTRIBUTES.set(el, elAttrs);
      }

      return node;
    },
    onNodeDiscarded(node) {
      const el = node as Element;
      ELEMENT_KEYS.delete(el);
      ELEMENT_ATTRIBUTES.get(el)?.forEach(bind => {
        if (bind.type === 'event') {
          bind.listener();
        }
      });
      ELEMENT_ATTRIBUTES.forEach((_, elem) => {
        if (el.contains(elem) || el.shadowRoot?.contains(elem)) {
          ELEMENT_ATTRIBUTES.delete(elem);
        }
      });
    },
  });
}