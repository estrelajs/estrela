import { toCamelCase } from '../../utils';
import { NodeData } from '../types';

export function buildData(
  data: Record<string, any>,
  isComponent: boolean
): NodeData {
  if (!data) {
    return {};
  }

  return Object.entries(data).reduce((data, [attr, arg]) => {
    // declarations
    const [, , namespace, attrName, , accessor, rawFilters] =
      /((on|use|class|style):)?([\w-]+)(\.([\w-]+))?(.*)/.exec(attr) ?? [];
    const filters =
      rawFilters
        ?.split('|')
        .slice(1)
        .map(s => s.trim()) ?? [];

    // bind
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

    if (isComponent) {
      data.props ??= {};
      data.props[attrName] = arg;
    } else {
      data.attrs ??= {};
      data.attrs[attrName] = arg;
    }

    return data;
  }, {} as NodeData);
}
