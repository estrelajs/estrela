import { isObservable, isState, createSelector } from '../../core';
import { apply, coerceArray, toCamelCase } from '../../utils';
import { VirtualNodeData } from '../virtual-node';

export function buildData(
  data: Record<string, any>,
  isComponent?: boolean
): VirtualNodeData {
  if (!data) {
    return {};
  }

  data = Object.entries(data).reduce((acc, [key, value]) => {
    // create selector
    if (Array.isArray(value) && typeof value.at(-1) === 'function') {
      const inputs = value.slice(0, -1) as any[];
      const states = inputs.filter(isObservable);
      const selectorFn = value.at(-1) as any;

      if (states.length === 0) {
        acc[key] = selectorFn(...inputs.map(apply));
      } else {
        acc[key] = createSelector(...states, (...args: any): any => {
          let index = 0;
          return selectorFn(
            ...inputs.map(arg => (isObservable(arg) ? args[index++] : arg()))
          );
        });
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(data).reduce((data, [attr, arg]) => {
    // declarations
    const [, , namespace, attrName, , accessor, rawFilters] =
      /((on|bind|use|class|style):)?([\w-]+)(\.([\w-]+))?(.*)/.exec(attr) ?? [];

    const filters =
      rawFilters
        ?.split('|')
        .slice(1)
        .map(s => s.trim()) ?? [];

    if (attr === 'bind') {
      data.bind = arg;
      return data;
    }

    // key
    if (attr === 'key') {
      data.key = valueOf(arg);
      return data;
    }

    // ref
    if (attr === 'ref') {
      data.ref = arg;
      return data;
    }

    // slot
    if (attr === 'slot') {
      data.slot = valueOf(arg);
      return data;
    }

    // class
    if (attrName === 'class') {
      // get class object
      const klass = parseClass(valueOf(arg));
      Object.keys(klass).forEach(key => {
        const value =
          typeof klass[key] === 'function' ? klass[key]() : klass[key];
        key
          .split(' ')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .forEach(k => {
            data.classes ??= {};
            data.classes[k] = Boolean(value);
          });
      });

      return data;
    }

    if (namespace === 'class') {
      // ex: class.foo={true}
      data.classes ??= {};
      data.classes[attrName] = valueOf(arg);
      return data;
    }

    // style
    if (attrName === 'style') {
      // get style object
      const style = parseStyle(valueOf(arg));
      Object.keys(style).forEach(k => {
        const value = typeof style[k] === 'function' ? style[k]() : style[k];
        const [key, filter] = k.split('|');
        data.styles ??= {};
        data.styles[toCamelCase(key)] = `${value}${filter ?? ''}`;
      });

      return data;
    }

    if (namespace === 'style') {
      // ex: style.max-width|px="{{0}}"
      // result: { maxWidth: '100px' }
      data.styles ??= {};
      data.styles[toCamelCase(attrName)] = `${valueOf(arg)}${filters[0] ?? ''}`;
      return data;
    }

    if (namespace === 'on') {
      data.events ??= {};
      data.events[attrName] = {
        filters,
        accessor: accessor ? toCamelCase(accessor) : undefined,
        handler: arg,
      };
      // to be implemented
      return data;
    }

    if (namespace === 'bind') {
      data.binds ??= {};
      data.binds[attrName] = arg;
    }

    if (namespace === 'use') {
      // to be implemented
      return data;
    }

    if (
      isComponent ||
      namespace === 'bind' ||
      attrName === 'bind' ||
      attr.startsWith('on')
    ) {
      data.props ??= {};
      data.props[attrName] = valueOf(arg);
    } else {
      data.attrs ??= {};
      data.attrs[attrName] = valueOf(arg);
    }

    return data;
  }, {} as VirtualNodeData);
}

function parseClass(
  klass: string | string[] | Record<string, any>
): Record<string, any> {
  if (typeof klass !== 'string' && !Array.isArray(klass)) {
    return klass;
  }
  return coerceArray(klass).reduce((acc, className) => {
    if (className.trim().length > 0) {
      acc[className.trim()] = true;
    }
    return acc;
  }, {} as Record<string, any>);
}

function parseStyle(style: string | Record<string, any>): Record<string, any> {
  if (typeof style !== 'string') {
    return style;
  }
  return String(style)
    .split(';')
    .reduce((acc, rule) => {
      const [key, value] = rule.split(':').map(s => s.trim());
      if (key.length > 0 && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
}

function valueOf(value: any): any {
  return isState(value) ? value() : value;
}
