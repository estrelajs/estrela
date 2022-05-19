import { createSelector } from '../../observables';
import { VirtualNodeData } from '../../types/data';
import { toCamelCase } from '../../utils';

export function buildData(
  data: Record<string, any>,
  isComponent?: boolean
): VirtualNodeData {
  data = Object.keys(data).reduce((acc, key) => {
    const value = data[key];
    const isFunctionProp = /^(on:.+|ref|children)$/.test(key);
    if (typeof value === 'function' && !isFunctionProp) {
      acc[key] = createSelector(value);
    }
    return acc;
  }, data);

  return Object.entries(data).reduce((data, [attr, arg]) => {
    const strictKeys = ['bind', 'class', 'key', 'ref', 'slot', 'style'];

    // bind
    if (strictKeys.includes(attr)) {
      data[attr as keyof VirtualNodeData] = arg;
      return data;
    }

    // declarations
    const [, , namespace, attrName, , accessor, rawFilters] =
      /((on|use|class|style):)?([\w-]+)(\.([\w-]+))?(.*)/.exec(attr) ?? [];
    const filters =
      rawFilters
        ?.split('|')
        .slice(1)
        .map(s => s.trim()) ?? [];

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

    if (namespace === 'on') {
      data.events ??= {};
      data.events[attrName] = {
        filters,
        accessor: accessor ? toCamelCase(accessor) : undefined,
        handler: arg,
      };
      return data;
    }

    if (namespace === 'use') {
      // to be implemented
      return data;
    }

    if (isComponent || attr === 'children') {
      data.props ??= {};
      data.props[attrName] = arg;
    } else {
      data.attrs ??= {};
      data.attrs[attrName] = arg;
    }

    return data;
  }, {} as VirtualNodeData);
}
