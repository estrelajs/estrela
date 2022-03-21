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
  isFalsy,
  isNextObserver,
  isNil,
  toElement,
} from '../../utils';
import { ElementRef } from '../element-ref';
import { StateSubject } from '../observables/StateSubject';
import { bindHandler } from './bind-handler';
import { morphdom, MorphDomOptions } from './morphdom';

const ELEMENT_ATTRIBUTES = new Map<
  HTMLElement,
  Record<string, AttrBind | undefined>
>();

/** Render template in element. */
export function render(
  template: HTMLTemplateLike | ComponentRender,
  element: HTMLElement | ShadowRoot
): void {
  if (!element) {
    console.error(
      'Template render error! A valid HTMLElement is required to render the template.'
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
  morphdom(element as HTMLElement, root, getMorphOptions(args));
}

export function getMorphOptions(args: any[]): MorphDomOptions {
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
        const [, , namespace, attrName, , accessor, , filter] =
          /(([\w-]+):)?([\w-]+)(\.([\w-]+))?(\|([\w-]+))?/.exec(attr) ?? [];

        const prop = getElementProperty(element, 'props')?.[attrName];
        let attrValue: any = reflectElement.getAttribute(attr);
        let attrArg: any = undefined;

        // when attr is arg index, we get the bindValue from the args
        if (attrValue && /^\$\$\d+$/.test(attrValue)) {
          attrArg = args[Number(attrValue.replace('$$', ''))];
          attrValue = attrArg instanceof StateSubject ? attrArg() : attrArg;
        }

        // remove attribute from the reflect HTMLElement.
        reflectElement.removeAttribute(attr);

        // attr handler
        const handler = getAttrHandlerName(element, attrName, namespace, accessor);

        const bindEvent = (event: string, target?: string) => {
          if (!bind) {
            const newBind: AttrBind = { attr, data: attrArg, filter, target };
            addEventListener(element, event, newBind);
            attrBinds[attr] = newBind;
          } else {
            bind.data = attrArg;
          }
        };

        const bindProp = () => {
          if (!bind || bind.data !== attrValue) {
            if (isNextObserver(prop)) {
              prop.next(attrValue);
            }
            attrBinds[attr] = { attr, data: attrValue };
          }
        };

        switch (handler) {
          case 'bind':
            if (attrArg instanceof StateSubject) {
              if (prop) {
                bindProp();
                if (!bind) {
                  const subscription = prop.subscribe(attrArg);
                  attrBinds[attr]!.cleanup = () => subscription.unsubscribe();
                }
              } else {
                const target = attrName === 'bind' ? undefined : attrName;
                attrBinds[attr] = bindHandler(element, attr, attrArg, bind, target);
              }
            } else {
              console.error(
                'Bind error! You can only bind to StateSubject instances.'
              );
            }
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
            bindEvent(attrName);
            return;

          case 'key':
            if (!bind) {
              attrBinds[attr] = { attr, data: attrValue };
            }
            return;

          case 'prop':
            bindProp();
            return;

          case 'ref':
            if (!bind) {
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
            if (!isFalsy(attrValue)) {
              attrValue = attrValue === true ? '' : attrValue;
              reflectElement.setAttribute(attrName, attrValue);
            }
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
      const el = node as HTMLElement;
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
      const el = node as HTMLElement;
      ELEMENT_ATTRIBUTES.forEach((attrBinds, elem) => {
        if (el.contains(elem) || el.shadowRoot?.contains(elem)) {
          Object.values(attrBinds).forEach(bind => {
            bind?.cleanup?.();
          });
          ELEMENT_ATTRIBUTES.delete(elem);
        }
      });
    },
  };
}

/** Add event listener to element and return a remover function. */
export function addEventListener<T>(
  element: HTMLElement,
  event: string,
  bind: AttrBind
): void {
  const hook = (event: Event) => {
    let data: any = event;
    if (event instanceof CustomEvent) {
      data = event.detail;
    } else if (bind.target) {
      data = (event.target as any)[bind.target];
    }
    if (isNextObserver(bind.data)) {
      bind.data.next(data);
    }
    if (typeof bind.data === 'function') {
      bind.data(data);
    }
  };
  element.addEventListener(event, hook);
  bind.cleanup = () => element.removeEventListener(event, hook);
}

export function getAttrHandlerName(
  element: HTMLElement,
  name: string,
  namespace?: string,
  accessor?: string
): AttrHandlerName {
  if (name === 'bind') {
    return 'bind';
  }

  if (!namespace && !accessor && /^class|key|ref|style$/.test(name)) {
    return name as 'class' | 'key' | 'ref' | 'style';
  }

  if (accessor && /^class|style$/.test(name)) {
    return (name + 'bind') as 'classbind' | 'stylebind';
  }

  if (namespace && /^bind|on$/.test(namespace)) {
    return namespace.replace('on', 'event') as 'bind' | 'event';
  }

  if (getElementProperty(element, 'props')?.[name]) {
    return 'prop';
  }

  return 'default';
}
