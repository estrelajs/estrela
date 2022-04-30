import { Component, Subscribable } from '../../core';
import { domApi } from '../domapi';
import { hooks } from '../hooks';
import { VirtualNodeData, PropertiesOf, NodeMetadata } from '../types';
import { ComponentRef } from './component-ref';

export class VirtualNode {
  sel?: string;
  data?: VirtualNodeData;
  children?: VirtualNode[];
  Component?: Component;
  componentRef?: ComponentRef;
  element?: Node;
  listener?: (e: Event) => void;
  observable?: Promise<any> | Subscribable<any>;
  text?: string | null;

  static empty = new VirtualNode();

  constructor(data?: PropertiesOf<VirtualNode>) {
    Object.assign(this, data ?? {});
  }

  clone(): VirtualNode {
    const node = new VirtualNode();
    if (this.sel) {
      node.sel = this.sel;
    }
    if (this.data) {
      node.data = this.data;
    }
    if (this.Component) {
      node.Component = this.Component;
    }
    if (this.observable) {
      node.observable = this.observable;
    }
    if (this.text) {
      node.text = this.text;
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
      if (this.sel === '#text') {
        element = document.createTextNode(this.text ?? '');
      } else if (this.sel === '#comment') {
        element = document.createComment(this.text ?? '');
      } else if (this.sel) {
        element = document.createElement(this.sel);
      } else {
        element = document.createDocumentFragment();
      }
      this.element = element as any;
      hooks.forEach(hook => hook.create?.(VirtualNode.empty, this));
    }

    if (this.componentRef) {
      element.appendChild(this.componentRef.create(this));
    } else {
      this.children?.forEach(child => {
        element.appendChild(child.createElement());
      });
    }

    return element;
  }

  getMetadata(): NodeMetadata {
    const children =
      this.componentRef?.getChildren() ??
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
    if (!this.sel) {
      return (
        this.Component === other.Component &&
        this.observable === other.observable
      );
    }
    return this.sel === other.sel;
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
