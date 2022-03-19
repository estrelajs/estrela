import morphdom from 'morphdom';
import {
  AttrBind,
  AttrHandlerName,
  HTMLTemplate,
  MorphDomOptions,
} from '../../types';
import {
  coerceTemplate,
  getElementProperty,
  isNil,
  isObserver,
  toElement,
} from '../../utils';
import { CONTEXT } from '../context';
import { StateSubject } from '../observables/StateSubject';

const ELEMENT_ATTRIBUTES = new Map<Element, Record<string, AttrBind | undefined>>();

/** Render template in element. */
export function render(
  template: HTMLTemplate | (() => HTMLTemplate),
  element: HTMLElement | DocumentFragment
): void {
  if (!element) {
    console.error(
      'Template render error! A valid Element is required to render the template.'
    );
    return;
  }

  // set context
  CONTEXT.hookIndex = 0;
  CONTEXT.element = element;
  CONTEXT.template = template;

  if (typeof template === 'function') {
    template = template();
  }

  const args: any[] = [];
  const html = coerceTemplate(template)
    .map(temp => temp.render(args))
    .join('');
  const root = toElement(`<div>${html}</div>`);

  // patch changes
  morphdom(element, root, getMorphOptions(args));
}

export function getMorphOptions(args: any[]): MorphDomOptions {
  const hasChanged = (bind?: AttrBind, value?: any) => {
    return !bind || bind.data !== value;
  };

  const bindAttributes = (element: HTMLElement, reflectElement: HTMLElement) => {
    const attributeNames = reflectElement.getAttributeNames?.() ?? [];
    const attrBinds = ELEMENT_ATTRIBUTES.get(element) ?? {};

    new Set([...attributeNames, ...Object.keys(attrBinds)]).forEach(attr => {
      const bind = attrBinds[attr];

      if (attributeNames.includes(attr)) {
        const [, , namespace, name, , filter] =
          /^(([\w-]+):)?([\w-]+)(.(\w+))?$/.exec(attr) ?? [];
        let attrValue: any = reflectElement.getAttribute(attr);
        let attrArg: any = undefined;

        // when attr is arg index, we get the bindValue from the args
        if (attrValue && /^\$\$\d+$/.test(attrValue)) {
          attrArg = args[Number(attrValue.replace('$$', ''))];
          attrValue = attrArg instanceof StateSubject ? attrArg() : attrArg;
        }

        // remove attribute from the reflect Element.
        reflectElement.removeAttribute(attr);

        switch (getAttrHandlerName(element, name, namespace)) {
          case 'bind':
            return;

          case 'class':
            let classes: string;
            if (Array.isArray(attrValue)) {
              classes = attrValue.map(String).join(' ');
            } else if (typeof attrValue === 'object') {
              classes = Object.keys(attrValue)
                .filter(key => !!attrValue[key])
                .flatMap(keys => keys.split(' '))
                .join(' ');
            } else {
              classes = isNil(attrValue) ? '' : String(attrValue);
            }
            reflectElement.setAttribute('class', classes);
            return;

          case 'classbind':
            const action = attrValue ? 'add' : 'remove';
            reflectElement.classList[action](name);
            attrBinds[attr] = { attr, data: attrValue };
            return;

          case 'event':
            if (!bind) {
              const _bind: AttrBind = { attr, data: attrArg };
              _bind.cleanup = addEventListener(element, name, _bind);
              attrBinds[attr] = _bind;
            } else {
              bind.data = attrArg;
            }
            return;

          case 'prop':
            const prop = getElementProperty(element, 'props')?.[name];
            if (hasChanged(bind, attrValue)) {
              if (isObserver(prop)) {
                prop.next(attrValue);
              }
              attrBinds[attr] = { attr, data: attrValue };
            }
            return;

          case 'ref':
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

          case 'style':
            let styles: string;
            if (typeof attrValue === 'object') {
              styles = Object.entries(attrValue)
                .map((k, v) => {
                  const [, key, filter] = /^([\w-]+)(.(\w+))?$/.exec(attr) ?? [];
                  const value = filter ? `${v}${filter}` : v;
                  return `${key}:${value};`;
                })
                .join('');
            } else {
              styles = isNil(attrValue) ? '' : String(attrValue);
            }
            reflectElement.setAttribute('style', styles);
            return;

          case 'stylebind':
            reflectElement.style[name as any] = filter
              ? `${attrValue}${filter}`
              : attrValue;
            return;

          default:
            reflectElement.setAttribute(attr, attrValue);
            return;
        }
      }

      // if it gets here, means we need to dispose the binding.
      bind?.cleanup?.();
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
      const el = node as HTMLElement;
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

/** Add event listener to element and return a remover function. */
export function addEventListener<T>(
  element: Element,
  event: string,
  bind: AttrBind
): () => void {
  const hook = (event: unknown) => {
    const data = event instanceof CustomEvent ? event.detail : event;
    if (isObserver(bind.data)) {
      bind.data.next(data);
    }
    if (typeof bind.data === 'function') {
      bind.data(data);
    }
  };
  element.addEventListener(event, hook);
  return () => element.removeEventListener(event, hook);
}

export function getAttrHandlerName(
  element: Element,
  name: string,
  namespace?: string
): AttrHandlerName {
  if (!namespace && /^ref|class|style$/.test(name)) {
    return name as 'ref' | 'class' | 'style';
  }

  if (namespace && /^bind|class|style$/.test(namespace)) {
    return `${namespace.replace('bind', '')}bind` as
      | 'bind'
      | 'classbind'
      | 'stylebind';
  }

  if (namespace === 'on') {
    return 'event';
  }

  const prop = getElementProperty(element, 'props')?.[name];

  if (prop) {
    return 'prop';
  }

  return 'default';
}
