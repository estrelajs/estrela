import morphdom from 'morphdom';
import { StateSubject } from '../../observables';
import {
  CustomElement,
  DirectiveCallback,
  HTMLTemplate,
  MorphDomOptions,
} from '../../types';
import {
  addEventListener,
  coerceTemplate,
  getElementProperty,
  isObserver,
  toElement,
} from '../../utils';
import { getHooks } from '../hooks';

type AttrBind<T = any> = {
  attr: string;
  data: T;
  listener?: () => void;
};

const ELEMENT_ATTRIBUTES = new Map<Element, Record<string, AttrBind | undefined>>();

/** Render template in element. */
export function render(
  template: HTMLTemplate,
  element: Element | DocumentFragment
): void {
  if (!element) {
    console.error(
      'Template render error! A valid Element is required to render the template.'
    );
    return;
  }

  const args: any[] = [];
  const html = coerceTemplate(template)
    .map(temp => temp.render(args))
    .join('');
  const root = toElement(`<div>${html}</div>`);
  const hooks = getHooks(element);

  // requestRender function for directive
  const requestRender = () => {
    let el = element;
    if (element instanceof ShadowRoot) {
      el = element.host;
    }
    if ((el as CustomElement).requestRender) {
      (el as CustomElement).requestRender();
    } else {
      render(template, el);
    }
  };

  // directives bind
  Array.from(root.querySelectorAll('template[_argIndex]')).forEach(template => {
    const directive: DirectiveCallback =
      args[Number(template.getAttribute('_argIndex'))];
    if (typeof directive === 'function') {
      render(directive(requestRender, hooks), template);
      template.replaceWith(...Array.from(template.childNodes));
    }
  });

  // patch changes
  morphdom(element, root, getMorphOptions(args));
}

function getMorphOptions(args: any[]): MorphDomOptions {
  const hasChanged = (bind?: AttrBind, value?: any) => {
    return !bind || bind.data !== value;
  };

  const bindAttributes = (element: Element, refElement: Element) => {
    const attributeNames = refElement.getAttributeNames?.() ?? [];
    const attrBinds = ELEMENT_ATTRIBUTES.get(element) ?? {};

    new Set([...attributeNames, ...Object.keys(attrBinds)]).forEach(attr => {
      const bind = attrBinds[attr];

      if (attributeNames.includes(attr)) {
        let arg: any = undefined;
        let value: any = refElement.getAttribute(attr);

        // when attr is arg index, we get the bindValue from the args
        if (value && /^\$\$\d+$/.test(value)) {
          arg = args[Number(value.replace('$$', ''))];
          value = arg instanceof StateSubject ? arg() : arg;
        }

        const isRef = attr === 'ref';
        const isEvent = /^on:[\w-]+/.test(attr);
        const propName = attr.replace(/^([\w-]+)?:/, '');
        const prop = getElementProperty(element, 'props')?.[propName];

        if (isRef || isEvent || prop) {
          refElement.removeAttribute(attr);
        } else {
          refElement.setAttribute(attr, String(value));
        }

        if (isRef) {
          if (hasChanged(bind, arg)) {
            if (isObserver(arg)) {
              arg.next(element);
            } else if (typeof arg === 'function') {
              arg(element);
            } else {
              console.error('Bind error! Could not bind element ref.');
            }
            attrBinds[attr] = { attr, data: arg };
          }
          return;
        }

        if (isEvent) {
          if (hasChanged(bind, arg)) {
            const listener = addEventListener(element, propName, arg);
            attrBinds[attr] = { attr, data: arg, listener };
          }
          return;
        }

        if (hasChanged(bind, value)) {
          if (prop && isObserver(prop)) {
            prop.next(value);
          }
          attrBinds[attr] = { attr, data: value };
        }
      } else {
        // it means we need to dispose the binding.
        bind?.listener?.();
        delete attrBinds[attr];
        element.removeAttribute(attr);
      }
    });

    if (Object.keys(attrBinds).length) {
      ELEMENT_ATTRIBUTES.set(element, attrBinds);
    } else {
      ELEMENT_ATTRIBUTES.delete(element);
    }
  };

  return {
    childrenOnly: true,
    getNodeKey(node) {
      const el = node as Element;
      const attr = el.getAttribute?.('key');
      const key = ELEMENT_ATTRIBUTES.get(el)?.['key']?.data;
      return attr ?? key ?? el.id;
    },
    onBeforeElUpdated(fromEl, toEl) {
      bindAttributes(fromEl, toEl);
      return true;
    },
    onNodeAdded(node) {
      const el = node as Element;
      bindAttributes(el, el);
      return node;
    },
    onNodeDiscarded(node) {
      const el = node as Element;
      ELEMENT_ATTRIBUTES.forEach((_, elem) => {
        if (el.contains(elem) || el.shadowRoot?.contains(elem)) {
          ELEMENT_ATTRIBUTES.delete(elem);
        }
      });
    },
  };
}
