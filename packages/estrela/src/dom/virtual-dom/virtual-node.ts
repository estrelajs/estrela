import { Component, Subscribable } from '../../core';
import { domApi } from '../domapi';
import { hooks } from '../hooks';
import { NodeMetadata, PropertiesOf, VirtualNodeData } from '../types';
import { ComponentRef } from './component-ref';

export class VirtualNode {
  kind?: string | Component;
  data?: VirtualNodeData;
  children?: VirtualNode[];
  componentRef?: ComponentRef;
  content?: any;
  element?: Node;
  listener?: (e: Event) => void;
  observable?: Promise<any> | Subscribable<any>;

  static empty = new VirtualNode();

  constructor(data?: PropertiesOf<VirtualNode>) {
    Object.assign(this, data ?? {});
  }

  clone(): VirtualNode {
    const node = new VirtualNode();
    if (this.kind) {
      node.kind = this.kind;
    }
    if (this.data) {
      node.data = this.data;
    }
    if (this.observable) {
      node.observable = this.observable;
    }
    if (this.content) {
      node.content = this.content;
    }
    if (this.children) {
      node.children = this.children.map(child => child.clone());
    }
    return node;
  }

  createElement(): Node {
    let element: Node;

    if (this.element) {
      element = this.element;
    } else {
      if (this.kind === '#text') {
        element = document.createTextNode(this.content ?? '');
      } else if (this.kind === '#comment') {
        element = document.createComment(this.content ?? '');
      } else if (typeof this.kind === 'string') {
        element = document.createElement(this.kind);
      } else {
        element = document.createDocumentFragment();
      }
      this.element = element as any;
      hooks.forEach(hook => hook.create?.(VirtualNode.empty, this));
    }

    if (this.componentRef) {
      element.appendChild(this.componentRef.createElement());
    } else {
      this.children?.forEach(child => {
        element.appendChild(child.createElement());
      });
    }

    return element;
  }

  getMetadata(): NodeMetadata {
    const children =
      this.componentRef?.getChildrenElements() ??
      this.children?.flatMap(child => {
        if (!child.element || domApi.isDocumentFragment(child.element)) {
          const meta = child.getMetadata();
          return meta.children ?? [];
        }
        return child.element;
      }) ??
      [];

    let element = this.element ?? null;
    let parent = element?.parentNode ?? null;
    let childIndex =
      element && parent
        ? Array.from(parent.childNodes).indexOf(element as ChildNode)
        : -1;
    const isFragment = !!element && domApi.isDocumentFragment(element);

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
  }

  isSame(other: VirtualNode): boolean {
    return this.kind === other.kind && this.observable === other.observable;
  }

  insertAtIndex(parent: Node, index: number): void {
    const nodeMeta = this.getMetadata();
    if (nodeMeta.isFragment) {
      nodeMeta.children.reverse().forEach(child => {
        parent!.insertBefore(child, parent!.childNodes[index]);
      });
      return;
    }
    const child = this.element ?? this.createElement();
    parent.insertBefore(child, parent.childNodes[index]);
  }

  removeElement(): void {
    this.emitRemove();

    if (this.element) {
      if (domApi.isDocumentFragment(this.element)) {
        this.children?.forEach(child => child.removeElement());
      } else {
        const parent = this.element.parentNode;
        if (parent) {
          parent.removeChild(this.element);
        }
      }
    }
  }

  replaceElement(other: VirtualNode): void {
    this.emitRemove();
    const meta = this.getMetadata();
    const element = other?.element ?? other.createElement();

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
  }

  walk(cb: (node: VirtualNode) => void, opts?: { on: 'enter' | 'exit' }): void {
    const { on = 'exit' } = opts || {};
    if (on === 'enter') {
      cb(this);
    }
    if (this.children) {
      for (const child of this.children) {
        child.walk(cb);
      }
    }
    if (on === 'exit') {
      cb(this);
    }
  }

  private emitRemove() {
    // dispatch remove for each node in the tree.
    this.walk(node => hooks.forEach(hook => hook.remove?.(node)), {
      on: 'enter',
    });
  }
}
