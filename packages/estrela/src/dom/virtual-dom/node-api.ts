import { hooks } from '../hooks';
import { VirtualNode } from '../virtual-node';
import { walk } from './walk';

const emptyNode: VirtualNode = {};

interface NodeMetadata {
  parent: Node | null;
  element: Node | null;
  children: Node[];
  childIndex: number;
  isFragment: boolean;
}

export const nodeApi = {
  getMetadata(node: VirtualNode): NodeMetadata {
    const children =
      node.componentRef?.getChildren() ??
      node.children?.flatMap(child => {
        if (!child.element || nodeApi.isDocumentFragment(child.element)) {
          const meta = nodeApi.getMetadata(child);
          return meta.children ?? [];
        }
        return child.element;
      }) ??
      [];

    let element = node.element ?? null;
    let parent = element?.parentNode ?? null;
    let childIndex =
      element && parent
        ? Array.from(parent.childNodes).indexOf(element as ChildNode)
        : -1;

    const isFragment = !!element && nodeApi.isDocumentFragment(element);
    if (isFragment) {
      const firstChild = children?.[0] as ChildNode | undefined;
      parent = firstChild?.parentNode ?? null;
      if (parent && firstChild) {
        childIndex = Array.from(parent.childNodes).indexOf(firstChild);
      }
    }

    return {
      parent,
      element,
      children,
      childIndex,
      isFragment,
    };
  },
  createElement(node: VirtualNode): Node {
    let element: Node;

    if (node.element) {
      element = node.element;
    } else {
      if (node.sel === '#text') {
        element = document.createTextNode(node.text ?? '');
      } else if (node.sel === '#comment') {
        element = document.createComment(node.text ?? '');
      } else if (node.sel) {
        element = document.createElement(node.sel);
      } else {
        element = document.createDocumentFragment();
      }
      node.element = element as any;
      hooks.forEach(hook => hook.create?.(emptyNode, node));
    }

    node.children?.forEach(child => {
      const childElement = nodeApi.createElement(child);
      if (!node.componentRef) {
        element.appendChild(childElement);
      }
    });

    if (node.componentRef) {
      const componentElement = node.componentRef?.create(node);
      element.appendChild(componentElement);
    }

    return element;
  },
  insertAtIndex(parent: Node, node: VirtualNode, index: number): void {
    const nodeMeta = nodeApi.getMetadata(node);
    if (nodeMeta.isFragment) {
      nodeMeta.children.reverse().forEach(child => {
        parent!.insertBefore(child, parent!.childNodes[index]);
      });
      return;
    }
    const child = node.element ?? nodeApi.createElement(node);
    parent.insertBefore(child, parent.childNodes[index]);
  },
  removeElement(node: VirtualNode): void {
    // dispatch remove for each node in the tree.
    walk(node, node => hooks.forEach(hook => hook.remove?.(node)), {
      on: 'enter',
    });

    const element = node.element;
    if (element) {
      if (nodeApi.isDocumentFragment(element)) {
        node.children?.forEach(child => nodeApi.removeElement(child));
      } else {
        const parent = element.parentNode;
        if (parent) {
          parent.removeChild(element);
        }
      }
    }
  },
  replaceElement(oldNode: VirtualNode, node: VirtualNode): void {
    // dispatch remove for each node in the tree.
    walk(oldNode, node => hooks.forEach(hook => hook.remove?.(node)), {
      on: 'enter',
    });

    const meta = nodeApi.getMetadata(oldNode);
    const element = node?.element ?? nodeApi.createElement(node);

    if (meta.parent) {
      if (meta.isFragment) {
        meta.parent.replaceChild(element, meta.children[0]);
        meta.children
          .slice(1)
          .forEach(child => meta.parent!.removeChild(child));
      } else if (meta.element) {
        meta.parent.replaceChild(element, meta.element);
      }
    }
  },
  isSame(node: VirtualNode, other: VirtualNode): boolean {
    if (!node.sel) {
      return (
        node.Component === other.Component &&
        node.observable === other.observable
      );
    }
    return node.sel === other.sel;
  },
  isElement(node: Node): node is Element {
    return node.nodeType === 1;
  },
  isHTMLElement(node: Node): node is HTMLElement {
    return nodeApi.isElement(node) && (node as any).style;
  },
  isText(node: Node): node is Text {
    return node.nodeType === 3;
  },
  isComment(node: Node): node is Comment {
    return node.nodeType === 8;
  },
  isDocumentFragment(node: Node): node is DocumentFragment {
    return node.nodeType === 11;
  },
  setTextContent(node: Node, text: string | null): void {
    node.textContent = text;
  },
};
