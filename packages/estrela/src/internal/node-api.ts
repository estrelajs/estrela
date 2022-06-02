import { VirtualNode } from './virtual-node';

export function insert(parent: Node, child: Node, before?: Node | null): Node {
  return before
    ? parent.insertBefore(child, before)
    : parent.appendChild(child);
}

export function mapNodeTree(tree: Node): Record<number, Node> {
  let index = 0;
  const result: Record<number, Node> = {};
  const walk = (node: Node) => {
    result[index++] = node;
    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  };
  walk(tree);
  return result;
}

export function patchChildren(
  parent: Node,
  children: VirtualNode[],
  nextChildren: VirtualNode[]
): VirtualNode[] {
  const result: VirtualNode[] = [];
  const currentLength = children.length;
  const nextLength = nextChildren.length;

  for (let i = 0; i < nextLength; i++) {
    if (i < currentLength) {
      const node = children[i];
      // const node = patch(parent, children[i], nextChildren[i]);
      result.push(node);
    } else {
      const node = nextChildren[i];
      const before = result.at(-1)?.nextSibling ?? null;
      node.mount(parent, before);
      result.push(node);
    }
  }
  for (let i = currentLength - 1; i >= nextLength; i--) {
    children[i].unmount(parent);
  }
  return result;
}

// function patch(
//   parent: Node,
//   node: VirtualNode,
//   nextNode: VirtualNode
// ): VirtualNode {
//   if (isSame(node, nextNode)) {
//     if (node instanceof ComponentNode) {
//       node.patch((nextNode as ComponentNode).data);
//       return node;
//     }
//     nextNode = nextNode as Node;
//     if (isTextElement(node)) {
//       if (node.textContent !== nextNode.textContent) {
//         node.textContent = nextNode.textContent;
//       }
//     } else {
//       const children = Array.from(node.childNodes);
//       const nextChildren = Array.from(nextNode.childNodes);
//       patchChildren(parent, children, nextChildren);
//     }
//     return node;
//   }
//   // replaceChild(parent, nextNode, node);
//   return nextNode;
// }

export function template(html: string): Node {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild as Node;
}
