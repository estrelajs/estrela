import { EventEmitter, StateSubject } from '../../observables';
import { HTMLTemplate } from '../../types';
import { addEventListener, coerceTemplate, tryToBindPropValue } from '../../utils';
import { getHooks } from '../hooks';
import { morphdom, toElement } from '../morphdom';

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

/** Render template in element. */
export function render(
  template: HTMLTemplate,
  element: Element | DocumentFragment
): void {
  if (!element) {
    console.error('Could not render template! Element is undefined.');
    return;
  }

  const args: any[] = [];
  const html = coerceTemplate(template)
    .map(temp => temp.render(args))
    .join('');
  const root = toElement(`<div>${html}</div>`) as HTMLElement;
  const hooks = getHooks(element);

  const requestRender = () => {
    if (!(element as any)._requestedRender) {
      render(template, element);
    }
  };

  // directive bind
  Array.from(root.querySelectorAll('template[_argIndex]')).forEach(template => {
    const directive = args[Number(template.getAttribute('_argIndex'))];
    if (typeof directive === 'function') {
      const htmlTemplate = directive(requestRender, hooks);
      render(htmlTemplate, template);
      template.replaceWith(...(template.childNodes as any));
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
          const propName = attr.name.replace('on:', '');
          const lastValue = bind.data;
          let nextValue: any = undefined;

          // when attr is arg index, we get the bindValue from the args
          if (/^\$\$\d+$/.test(attr.value)) {
            const argIndex = Number(attr.value.replace('$$', ''));
            const arg = args[argIndex];
            nextValue = arg instanceof StateSubject ? arg() : arg;
          } else {
            // else get value from the attribute string
            nextValue = attr.value;
          }

          if (nextValue !== lastValue) {
            bind.data = nextValue;

            switch (bind.type) {
              case 'event':
                bind.listener();
                bind.listener = addEventListener(fromEl, propName, nextValue);
                break;
              case 'ref':
                bind.data.next(fromEl);
                break;
              case 'prop':
                tryToBindPropValue(fromEl, propName, nextValue);
                break;
            }
          }

          if (!/^[\w-]+:/.test(attr.name)) {
            toEl.setAttribute(propName, String(nextValue));
          }
        } else {
          // cleanup and remove from the ELEMENT_ATTRIBUTES map
          if (bind.type === 'event') {
            bind.listener();
          }
          const attrs = [...elAttrs];
          attrs.splice(attrs.indexOf(bind), 1);
          ELEMENT_ATTRIBUTES.set(fromEl, attrs);
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
        const propName = attr.name.replace('on:', '');
        let bindValue: any = undefined;

        // when attr is arg index, we get the bindValue from the args
        if (/^\$\$\d+$/.test(attr.value)) {
          const argIndex = Number(attr.value.replace('$$', ''));
          const arg = args[argIndex];
          bindValue = arg instanceof StateSubject ? arg() : arg;

          // bind event listeners
          if (attr.name.startsWith('on:')) {
            const listener = addEventListener(el, propName, arg);
            el.removeAttribute(attr.name);
            binds.push({
              attr: attr.name,
              data: arg,
              listener,
              type: 'event',
            });
            return;
          }
        } else {
          // else get value from the attribute string
          bindValue = attr.value;
        }

        // try to bind prop value
        tryToBindPropValue(el, propName, bindValue);
        el.setAttribute(propName, String(bindValue));
        //   el.removeAttribute(attr.name);
        binds.push({
          attr: attr.name,
          data: bindValue,
          type: 'prop',
        });
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
