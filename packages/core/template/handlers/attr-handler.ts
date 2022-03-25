import { AttrBind } from 'packages/types';
import { getElementProperty, isFalsy, isNextObserver, isNil } from '../../../utils';
import { StateSubject } from '../../observables/StateSubject';
import { bindHandler } from './bind-handler';
import { getAttrHandlerName } from './attr-handler-name';
import { eventFilterHandler, styleFilterHandler } from './filter-handler';

function valueOf(arg: any): any {
  return arg instanceof StateSubject ? arg() : arg;
}

export function attrHandler(
  element: HTMLElement,
  reflectElement: HTMLElement,
  attr: string,
  arg: any,
  bind: AttrBind | undefined
): AttrBind | undefined {
  const [, , namespace, attrName, , accessor] =
    /^(([\w-]+):)?([\w-]+)(\.([\w-]+))?/.exec(attr) ?? [];
  const filters = attr.split('|').slice(1);
  const prop = getElementProperty(element, 'props')?.[attrName];
  const handler = getAttrHandlerName(element, attrName, namespace, accessor);

  const bindProp = () => {
    const data = valueOf(arg);
    if (!bind || bind.data !== data) {
      if (isNextObserver(prop)) {
        prop.next(data);
      }
      bind = { data };
    }
    return bind;
  };

  switch (handler) {
    case 'bind':
      if (arg instanceof StateSubject) {
        if (prop) {
          const hasBind = !!bind;
          bind = bindProp();
          if (!hasBind) {
            const subscription = prop.subscribe(arg);
            bind.cleanup = () => subscription.unsubscribe();
          }
        } else {
          const target = attrName === 'bind' ? undefined : attrName;
          bind = bindHandler(element, arg, bind, target);
        }
      } else {
        console.error('Bind error! You can only bind to StateSubject instances.');
      }
      return bind;

    case 'class':
      let classes: string;
      const argValue = valueOf(arg);
      if (Array.isArray(argValue)) {
        classes = argValue.map(String).join(' ');
      } else if (typeof argValue === 'object') {
        classes = Object.keys(argValue)
          .filter(key => !!argValue[key])
          .flatMap(keys => keys.split(' '))
          .join(' ');
      } else {
        classes = isNil(argValue) ? '' : String(argValue);
      }
      reflectElement.setAttribute('class', classes);
      return bind;

    case 'classbind':
      const action = valueOf(arg) ? 'add' : 'remove';
      reflectElement.classList[action](accessor);
      return bind;

    case 'event':
      if (!bind) {
        bind = { data: arg, accessor, filters };
        createEventListener(element, attrName, bind);
      } else {
        bind.data = arg;
        bind.accessor = accessor;
        bind.filters = filters;
      }
      return bind;

    case 'key':
      return bind ?? { data: valueOf(arg) };

    case 'prop':
      return bindProp();

    case 'ref':
      if (!bind) {
        if (isNextObserver(arg)) {
          arg.next(element);
        } else if (typeof arg === 'function') {
          arg(element);
        } else {
          console.error('Bind error! Could not bind element ref.');
        }
        bind = { data: arg };
      }
      return bind;

    case 'style':
      let styles: string;
      if (typeof valueOf(arg) === 'object') {
        styles = Object.entries(valueOf(arg))
          .map((k, v) => `${k}:${styleFilterHandler(v, filters[0])};`)
          .join('');
      } else {
        styles = isNil(valueOf(arg)) ? '' : String(valueOf(arg));
      }
      reflectElement.setAttribute('style', styles);
      return bind;

    case 'stylebind':
      reflectElement.style[accessor as any] = styleFilterHandler(
        valueOf(arg),
        filters[0]
      );
      return bind;

    default:
      if (!isFalsy(valueOf(arg))) {
        const value = valueOf(arg) === true ? '' : valueOf(arg);
        reflectElement.setAttribute(attrName, value);
      }
      return bind;
  }
}

function createEventListener<T>(
  element: HTMLElement,
  event: string,
  bind: AttrBind
): void {
  const hook = (event: Event) => {
    // accessor
    if (event instanceof KeyboardEvent && bind.accessor) {
      const key = bind.accessor
        .split('-')
        .map(k => k.charAt(0).toUpperCase() + k.slice(1))
        .join('');
      if (bind.accessor && event.key !== key) {
        return;
      }
    }

    // filters
    if (bind.filters?.length) {
      const filteredEvent = eventFilterHandler(event, bind.filters, element);
      if (filteredEvent === false) return;
      event = filteredEvent;

      // once filter
      if (bind.filters.includes('once')) {
        bind.cleanup?.();
      }
    }

    let data: any = event;
    if (event instanceof CustomEvent) {
      data = event.detail;
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
