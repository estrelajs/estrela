import { isFalsy, toCamelCase, toKebabCase } from '../utils';
import { EstrelaTemplate } from './estrela-template';
import { EstrelaFragment } from './types';

export function coerceNode(data: any): Node {
  if (data instanceof Node) {
    return data;
  }
  if (data instanceof EstrelaTemplate) {
    const fragment = document.createDocumentFragment();
    (fragment as any)['template'] = data;
    return fragment;
  }
  const text = isFalsy(data) ? '' : String(data);
  return document.createTextNode(text);
}

export function insertChild(
  parent: Node,
  child: Node,
  before: Node | null = null
): Node {
  const beforeNode =
    parseEstrelaFragment(before)?.instance?.firstChild ?? before;
  const fragment = parseEstrelaFragment(child);
  if (fragment) {
    if (fragment.instance) {
      fragment.instance.nodes.forEach(node => {
        parent.insertBefore(node, beforeNode);
      });
    } else {
      const instance = fragment.template.mount(parent, beforeNode);
      fragment.instance = instance;
    }
    return fragment;
  }
  return parent.insertBefore(child, beforeNode);
}

export function removeChild(child: Node): void {
  const fragment = parseEstrelaFragment(child);
  if (fragment) {
    fragment.instance?.unmount();
  } else {
    child.parentNode?.removeChild(child);
  }
}

export function replaceChild(parent: Node, node: Node, child: Node): Node {
  if (node === child) {
    return child;
  }
  if (node instanceof Text && child instanceof Text) {
    if (node.textContent !== child.textContent) {
      child.textContent = node.textContent;
    }
    return child;
  }
  const nodeFragment = parseEstrelaFragment(node);
  const childFragment = parseEstrelaFragment(child);
  if (
    nodeFragment &&
    childFragment &&
    childFragment.instance &&
    childFragment.template.template === nodeFragment.template.template
  ) {
    childFragment.instance.patchProps(nodeFragment.template.props);
    return childFragment;
  }
  const result = insertChild(parent, node, child);
  removeChild(child);
  return result;
}

export function setAttribute(
  element: HTMLElement,
  attr: string,
  value: unknown
): void {
  if (attr === 'class') {
    if (typeof value === 'string') {
      element.className = value;
    } else if (Array.isArray(value)) {
      element.className = value.join(' ');
    } else if (value && typeof value === 'object') {
      element.className = Object.entries(value)
        .reduce((acc, [key, value]) => acc + (value ? ` ${key}` : ''), '')
        .trim();
    }
    return;
  }

  if (attr.startsWith('class:')) {
    const klass = attr.substring(6);
    if (isFalsy(value)) {
      element.classList.remove(klass);
    } else {
      element.classList.add(klass);
    }
    return;
  }

  if (attr === 'style') {
    if (typeof value === 'string') {
      element.style.cssText = value;
    } else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      Object.keys(value).forEach(key => {
        element.style.setProperty(toKebabCase(key), String(obj[key]));
      });
    }
    return;
  }

  if (attr.startsWith('style:')) {
    const style = toCamelCase(attr.substring(6));
    if (style in element.style) {
      const key = style as any;
      element.style[key] = String(value);
    }
    return;
  }

  if (isFalsy(value)) {
    element.removeAttribute(attr);
  } else if (value === true) {
    element.setAttribute(attr, '');
  } else {
    element.setAttribute(attr, String(value));
  }
}

function parseEstrelaFragment(node: Node | null): EstrelaFragment | null {
  if (node instanceof DocumentFragment) {
    const fragment = node as unknown as EstrelaFragment;
    if (fragment.template) {
      return fragment;
    }
  }
  return null;
}
