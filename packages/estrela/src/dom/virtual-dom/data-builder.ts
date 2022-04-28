import { isPromise, isSubscribable } from '../../core';
import { createSelector } from '../../store';
import { apply, toCamelCase } from '../../utils';
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
    // TODO: move code to a shared file
    if (Array.isArray(value) && typeof value.at(-1) === 'function') {
      const selectorFn = value.pop() as any;
      const inputs = value as any[];
      const states = inputs.filter(
        input => isPromise(input) || isSubscribable(input)
      );

      if (states.length === 0) {
        acc[key] = selectorFn(...inputs.map(apply));
      } else {
        acc[key] = createSelector(...states, (...args: any): any => {
          let index = 0;
          return selectorFn(
            ...inputs.map(arg => (isSubscribable(arg) ? args[index++] : arg()))
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
      /((on|bind|use|class|style|attr|prop):)?([\w-]+)(\.([\w-]+))?(.*)/.exec(
        attr
      ) ?? [];

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
      data.key = arg;
      return data;
    }

    // ref
    if (attr === 'ref') {
      data.ref = arg;
      return data;
    }

    // slot
    if (attr === 'slot') {
      data.slot = arg;
      return data;
    }

    // class
    if (attr === 'class') {
      data.class = arg;
      return data;
    }

    // style
    if (attr === 'style') {
      data.style = arg;
      return data;
    }

    if (namespace === 'class') {
      // ex: class.foo={true}
      data.classes ??= {};
      data.classes[attrName] = arg;
      return data;
    }

    if (namespace === 'style') {
      data.styles ??= {};
      data.styles[toCamelCase(attrName)] = arg;
      return data;
    }

    if (namespace === 'attrs') {
      data.attrs ??= {};
      data.attrs[attrName] = arg;
      return data;
    }

    if (namespace === 'prop') {
      data.props ??= {};
      data.props[attrName] = arg;
      return data;
    }

    if (namespace === 'on') {
      data.events ??= {};
      data.events[attrName] = {
        filters,
        accessor: accessor ? toCamelCase(accessor) : undefined,
        handler: arg,
      };
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
      data.props[attrName] = arg;
    } else {
      data.attrs ??= {};
      data.attrs[attrName] = arg;
    }

    return data;
  }, {} as VirtualNodeData);
}
