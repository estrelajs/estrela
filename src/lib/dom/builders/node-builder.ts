import { ComponentRef, StyledComponent } from '../../core';
import { setAttr } from '../attr-handler';
import {
  isVComponent,
  isVFragment,
  isVText,
  VNode,
  vNodeWalker,
} from '../vnode';

export function buildNode(newNode: VNode): Node {
  if (isVComponent(newNode)) {
    const ref = ComponentRef.createRef(
      newNode.Component,
      newNode.data.props ?? {}
    );

    newNode.ref = ref;
    ref.patchChildren(newNode.children);

    const styledComponent = newNode.Component as StyledComponent<any>;
    if (styledComponent.styleId) {
      vNodeWalker(newNode, node => {
        if (!isVText(node) && !isVFragment(node)) {
          node.data.props ??= {};
          node.data.props[`_host-${styledComponent.styleId}`] = '';
        }
      });
    }
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
