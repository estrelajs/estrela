import { AttrBind, ComponentRender, HTMLTemplateLike } from '../../types';
import { apply, coerceTemplate, toElement } from '../../utils';
import { ElementRef } from '../element-ref';
import { attrHandler } from './handlers/attr-handler';
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
        let arg: any = reflectElement.getAttribute(attr);
        if (arg && /^\$\$\d+$/.test(arg)) {
          // when attr is arg index, we get it from args
          arg = args[Number(arg.replace('$$', ''))];
        }

        // remove attribute from the reflect HTMLElement.
        reflectElement.removeAttribute(attr);

        attrBinds[attr] = attrHandler(element, reflectElement, attr, arg, bind);
        return;
      }

      // if it gets here, means we need to dispose bindings.
      if (bind) {
        bind.cleanup?.();
        delete attrBinds[attr];
        element.removeAttribute(attr);
      }
    });

    if (Object.values(attrBinds).filter(bind => !!bind).length > 0) {
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
