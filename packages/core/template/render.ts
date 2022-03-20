import { morphdom, MorphDomOptions } from './morphdom';
import {
  AttrBind,
  AttrHandlerName,
  ComponentRender,
  HTMLTemplateLike,
} from '../../types';
import {
  apply,
  coerceTemplate,
  getElementProperty,
  isNil,
  isNextObserver,
  toElement,
} from '../../utils';
import { StateSubject } from '../observables/StateSubject';
import { ElementRef } from '../element-ref';

const ELEMENT_ATTRIBUTES = new Map<Element, Record<string, AttrBind | undefined>>();

/** Render template in element. */
export function render(
  template: HTMLTemplateLike | ComponentRender,
  element: HTMLElement | ShadowRoot
): void {
  if (!element) {
    console.error(
      'Template render error! A valid Element is required to render the template.'
    );
    return;
  }

  // set template ref
  ElementRef.setTemplate(template, element);

  // return the template itself.
  template = apply(template);

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

  const processElement = (element: HTMLElement, reflectElement: HTMLElement) => {
    const attributeNames = reflectElement.getAttributeNames?.() ?? [];
    const attrBinds = ELEMENT_ATTRIBUTES.get(element) ?? {};

    // remove separator braces
    reflectElement.childNodes.forEach(node => {
      const parseText = (text: Text) => {
        const match = /{{|}}/.exec(text.textContent ?? '');
        if (match) {
          const nextText = text.splitText(match.index);
          nextText.textContent = nextText.textContent?.slice(2) ?? '';
          parseText(nextText);
        }
      };
      if (typeof (node as Text).splitText === 'function') {
        parseText(node as Text);
      }
    });

    // bind attributes
    new Set([...attributeNames, ...Object.keys(attrBinds)]).forEach(attr => {
      const bind = attrBinds[attr];

      if (attributeNames.includes(attr)) {
        const [, , namespace, name, , accessor, , filter] =
          /(([\w-]+):)?([\w-]+)(\.([\w-]+))?(\|([\w-]+))?/.exec(attr) ?? [];

        let attrValue: any = reflectElement.getAttribute(attr);
        let attrArg: any = undefined;

        // when attr is arg index, we get the bindValue from the args
        if (attrValue && /^\$\$\d+$/.test(attrValue)) {
          attrArg = args[Number(attrValue.replace('$$', ''))];
          attrValue = attrArg instanceof StateSubject ? attrArg() : attrArg;
        }

        // remove attribute from the reflect Element.
        reflectElement.removeAttribute(attr);

        switch (getAttrHandlerName(element, name, namespace, accessor)) {
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
            reflectElement.classList[action](accessor);
            attrBinds[attr] = { attr, data: attrValue };
            return;

          case 'event':
            if (!bind) {
              const _bind: AttrBind = { attr, data: attrArg, filter };
              _bind.cleanup = addEventListener(element, name, _bind);
              attrBinds[attr] = _bind;
            } else {
              bind.data = attrArg;
            }
            return;

          case 'prop':
            const prop = getElementProperty(element, 'props')?.[name];
            if (hasChanged(bind, attrValue)) {
              if (isNextObserver(prop)) {
                prop.next(attrValue);
              }
              attrBinds[attr] = { attr, data: attrValue };
            }
            return;

          case 'ref':
            if (hasChanged(bind, attrArg)) {
              if (isNextObserver(attrArg)) {
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
            reflectElement.style[accessor as any] = filter
              ? `${attrValue}${filter}`
              : attrValue;
            return;

          default:
            reflectElement.setAttribute(attr, attrValue);
            return;
        }
      }

      // if it gets here, means we need to dispose bindings.
      if (bind) {
        bind.cleanup?.();
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
      processElement(fromEl, toEl);
      return true;
    },
    onNodeAdded(node) {
      const el = node as HTMLElement;
      processElement(el, el);
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
  const hook = (event: Event) => {
    const data = event instanceof CustomEvent ? event.detail : event;
    if (isNextObserver(bind.data)) {
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
  namespace?: string,
  accessor?: string
): AttrHandlerName {
  if (!namespace && !accessor && /^ref|class|style$/.test(name)) {
    return name as 'ref' | 'class' | 'style';
  }

  if (accessor && /^class|style$/.test(name)) {
    return (name + 'bind') as 'classbind' | 'stylebind';
  }

  if (namespace === 'bind') {
    return 'bind';
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
