import VNode from 'virtual-dom/vnode/vnode';
import VText from 'virtual-dom/vnode/vtext';
import { isNil } from '../../utils';

import { AstChildNode, AstNode } from './ast-builder';

export function buildVTree(ast: AstNode): VirtualDOM.VNode {
  const visitor = (node: AstChildNode): VirtualDOM.VTree => {
    if (typeof node === 'string') {
      return new VText(node);
    }

    const { tagName, props, children } = node;
    const { key, ref, ...attrs } = props;

    return new VNode(
      tagName,
      attrs,
      children.flatMap(visitor),
      isNil(key) ? undefined : String(key)
    );
  };

  return visitor(ast) as VirtualDOM.VNode;
}
