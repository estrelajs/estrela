import morphdom from '../morphdom';
import { EventEmitter } from '../observables/event_emitter';
import { StateSubject } from '../observables/state_subject';
import { html } from '../template/html-directive';
import { CustomElement } from '../types/custom-element';
import { addEventListener } from '../utils/add-event-listener';
import { coerceArray } from '../utils/coerce-array';
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

interface HTMLRender {
  html: string;
  args: any[];
}

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

const getResult = (template: string | HTMLResult): HTMLResult => {
  return typeof template === 'string' ? html`${template}` : template;
};

// TODO: add custom class and style binding
const htmlRender = (result: HTMLResult, args: any[] = []): HTMLRender => {
  const html = result.template
    .map((str, i) => {
      const arg = result.args[i];
      if (i >= result.args.length) {
        return str;
      }

      if (/\s((on)?:\w+|ref)=\"?$/.test(str)) {
        let index = args.indexOf(arg);
        if (index === -1) {
          index = args.push(arg) - 1;
        }
        return str + index;
      }

      if (arg instanceof HTMLResult || Array.isArray(arg)) {
        const results = coerceArray(arg)
          .map(_arg => htmlRender(_arg, args).html)
          .join('');
        return str + results;
      }

      const [isAttribute, hasQuotes] = /=(\")?$/.exec(str)?.values() ?? [];
      let value = arg instanceof StateSubject ? arg() : arg;
      value = String(value === false ? '' : value ?? '');

      if (!isAttribute) {
        value = `<!---->${value}<!---->`;
      } else if (!hasQuotes) {
        value = `"${value}"`;
      }

      return str + value;
    })
    .join('')
    .trim();

  return { html, args };
};

const ELEMENT_ATTRIBUTES = new Map<Element, AttrBind[]>();
const ELEMENT_KEYS = new Map<Element, string>();

export function render(
  template: string | HTMLResult | null,
  element: HTMLElement | DocumentFragment
) {
  if (template === null) return;
  const { html, args } = htmlRender(getResult(template));

  // patch changes
  morphdom(element, `<div>${html}</div`, {
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
