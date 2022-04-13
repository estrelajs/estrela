import { isObservableState } from '../../core';
import { coerceArray, toCamelCase } from '../../utils';
import { VirtualNodeData } from '../virtual-node';

export function buildDataFromAttributes(
  attributes: string,
  tokens: unknown[],
  isComponent?: boolean
): VirtualNodeData {
  const data: VirtualNodeData = {
    attrs: {},
    binds: {},
    class: {},
    events: {},
    props: {},
    style: {},
    key: undefined,
    ref: undefined,
    slot: undefined,
  };

  let match: RegExpExecArray | null;
  const attrRegex = /([^\s'"=]+)(=[\s'"]*([^'"]+))?/g;

  while ((match = attrRegex.exec(attributes))) {
    // declarations
    const regex = /^{{(\d+)}}$/;
    const [, attr, , value] = match;
    const [, , namespace, attrName, , accessor, rawFilters] =
      /((on|bind|use):)?([\w-]+)(\.([\w-]+))?(.*)/.exec(attr) ?? [];
    const arg = regex.test(value)
      ? (tokens[Number(value.replace(regex, '$1'))] as any)
      : value;
    const filters =
      rawFilters
        ?.split('|')
        .slice(1)
        .map(s => s.trim()) ?? [];

    // key
    if (attr === 'key') {
      data.key = valueOf(arg);
      continue;
    }

    // ref
    if (attr === 'ref') {
      data.ref = arg;
      continue;
    }

    // slot
    if (attr === 'slot') {
      data.slot = valueOf(arg);
      continue;
    }

    // class
    if (attrName === 'class') {
      if (accessor) {
        // ex: class.foo={true}
        data.class[accessor] = valueOf(arg);
        continue;
      }

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
            data.class[k] = Boolean(value);
          });
      });

      continue;
    }

    // style
    if (attrName === 'style') {
      if (accessor) {
        // ex: style.max-width|px="{{0}}"
        // result: { maxWidth: '100px' }
        data.style[toCamelCase(accessor)] = `${valueOf(arg)}${
          filters[0] ?? ''
        }`;
        continue;
      }

      // get style object
      const style = parseStyle(valueOf(arg));
      Object.keys(style).forEach(k => {
        const value = typeof style[k] === 'function' ? style[k]() : style[k];
        const [key, filter] = k.split('|');
        data.style[toCamelCase(key)] = `${value}${filter ?? ''}`;
      });

      continue;
    }

    if (namespace === 'on') {
      data.events[attrName] = {
        filters,
        accessor: accessor ? toCamelCase(accessor) : undefined,
        handler: arg,
      };
      // to be implemented
      continue;
    }

    if (namespace === 'bind' || attrName === 'bind') {
      data.binds[attrName] = arg;
    }

    if (namespace === 'use') {
      // to be implemented
      continue;
    }

    if (
      isComponent ||
      namespace === 'bind' ||
      attrName === 'bind' ||
      attr.startsWith('on')
    ) {
      data.props[attrName] = valueOf(arg);
    } else {
      data.attrs[attrName] = valueOf(arg);
    }
  }

  return data;
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
  return isObservableState(value) ? value() : value;
}
