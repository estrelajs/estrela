export function setAttr(node: HTMLElement, key: string, value: any) {
  if (key.startsWith('on')) {
    (node as any)[key] = value;
    return;
  }

  switch (key) {
    case 'style':
      node.style.cssText = value;
      break;

    case 'class':
      node.className = value;
      break;

    case 'checked':
      if (node.tagName.toLowerCase() === 'input') {
        if (value) {
          node.setAttribute(key, '');
        } else {
          node.removeAttribute(key);
        }
      } else {
        node.setAttribute(key, value);
      }
      break;

    case 'value':
      if (/input|textarea/.test(node.tagName.toLowerCase())) {
        (node as HTMLInputElement).value = value;
      } else {
        node.setAttribute(key, value);
      }
      break;

    default:
      node.setAttribute(key, value);
      break;
  }
}
