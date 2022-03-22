import { getElementProperty } from '../../../utils';

export type AttrHandlerName =
  | 'bind'
  | 'class'
  | 'classbind'
  | 'default'
  | 'event'
  | 'key'
  | 'prop'
  | 'ref'
  | 'style'
  | 'stylebind';

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
