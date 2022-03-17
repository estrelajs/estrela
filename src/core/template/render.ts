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

  // hooks for directives
  const hooks = {
    ...getHooks(element),
    requestRender() {
      let el = element;
      if (element instanceof ShadowRoot) {
        el = element.host;
      }
      if ((el as CustomElement).requestRender) {
        (el as CustomElement).requestRender();
      } else {
        render(template, el);
      }
    },
  };

  const args: any[] = [];
  const html = coerceTemplate(template)
    .map(temp => temp.render(args, hooks))
    .join('');
  const root = toElement(`<div>${html}</div>`);

  // // directives bind
  // Array.from(root.querySelectorAll('template[_argIndex]')).forEach(template => {
  //   const directive: DirectiveCallback<any> =
  //     args[Number(template.getAttribute('_argIndex'))];
  //   if (typeof directive === 'function') {
  //     render(directive(requestRender, hooks), template);
  //     template.replaceWith(...Array.from(template.childNodes));
  //   }
  // });

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
        let attrValue: any = refElement.getAttribute(attr);
        let attrArg: any = undefined;

        // when attr is arg index, we get the bindValue from the args
        if (attrValue && /^\$\$\d+$/.test(attrValue)) {
          attrArg = args[Number(attrValue.replace('$$', ''))];
          attrValue = attrArg instanceof StateSubject ? attrArg() : attrArg;
        }

        const isRef = attr === 'ref';
        const isClass = attr === 'class';
        const isEvent = /^on:[\w-]+/.test(attr);
        const isClassBind = /^class:[\w-]+$/.test(attr);

        const propName = attr.replace(/^([\w-]+)?:/, '');
        const prop = getElementProperty(element, 'props')?.[propName];

        if (isRef || isEvent || isClassBind || prop) {
          refElement.removeAttribute(attr);
        } else {
          refElement.setAttribute(attr, String(attrValue));
        }

        if (isRef) {
          if (hasChanged(bind, attrArg)) {
            if (isObserver(attrArg)) {
              attrArg.next(element);
            } else if (typeof attrArg === 'function') {
              attrArg(element);
            } else {
              console.error('Bind error! Could not bind element ref.');
            }
            attrBinds[attr] = { attr, data: attrArg };
          }
          return;
        }

        if (isClass) {
          let classes: string = String(attrValue);
          if (Array.isArray(attrValue)) {
            classes = attrValue.map(String).join(' ');
          } else if (typeof attrValue === 'object') {
            classes = Object.keys(attrValue)
              .filter(key => !!attrValue[key])
              .join(' ');
          }
          refElement.setAttribute('class', classes);
          return;
        }

        if (isEvent) {
          if (hasChanged(bind, attrArg)) {
            const listener = addEventListener(element, propName, attrArg);
            attrBinds[attr] = { attr, data: attrArg, listener };
          }
          return;
        }

        if (isClassBind) {
          if (hasChanged(bind, attrValue)) {
            const action = attrValue ? 'add' : 'remove';
            refElement.classList[action](propName);
            attrBinds[attr] = { attr, data: attrValue };
          }
          return;
        }

        if (hasChanged(bind, attrValue)) {
          if (prop && isObserver(prop)) {
            prop.next(attrValue);
          }
          attrBinds[attr] = { attr, data: attrValue };
        }

        return;
      }

      // if it gets here, means we need to dispose the binding.
      bind?.listener?.();
      delete attrBinds[attr];
      element.removeAttribute(attr);
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
