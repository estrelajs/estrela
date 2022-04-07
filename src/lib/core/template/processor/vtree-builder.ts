import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';
import { isNil } from '../../utils';
import { AstChildNode, AstNode } from './ast-builder';
import { Widget } from './widget';

export function buildVTree(ast: AstNode): VirtualDOM.VNode {
  const visitor = (node: AstChildNode): VirtualDOM.VTree => {
    if (typeof node === 'string') {
      return new VText(node);
    }

    const { element, props, children } = node;
    const { key, ref, ..._props } = props;
    const _children = children.flatMap(visitor);
    const _key = isNil(key) ? undefined : String(key);

    if (typeof element === 'function') {
      return new Widget(element, _props);
    }

    return new VNode(element, _props, _children, _key);
  };

  return visitor(ast) as VirtualDOM.VNode;
}
