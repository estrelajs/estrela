import { ComponentRef } from '../../core';
import { setAttr } from '../attr-handler';
import { isVComponent, isVFragment, isVText, VNode } from '../vnode';

export function buildNode(newNode: VNode): Node {
  if (isVComponent(newNode)) {
    const ref = ComponentRef.createRef(
      newNode.Component,
      newNode.data.props ?? {}
    );
    ref.patchChildren(newNode.children);
    newNode.ref = ref;
  }

  if (isVText(newNode)) {
    const text = document.createTextNode(newNode.content);
    newNode.node = text;
    return text;
  }

  const element =
    newNode.type === 'fragment'
      ? document.createDocumentFragment()
      : document.createElement(newNode.type);
  newNode.children.forEach(child => element.appendChild(buildNode(child)));
  newNode.node = element;

  // set attributes
  if (!isVFragment(newNode) && !(element instanceof DocumentFragment)) {
    const props = newNode.data.props ?? {};
    Object.keys(props).forEach(key => setAttr(element, key, props[key]));
  }

  return element;
}
