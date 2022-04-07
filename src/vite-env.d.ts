/// <reference types="vite/client" />

declare module 'dom-walk' {
  export default function walk(
    children: NodeListOf<ChildNode>,
    callback: (node: Node, index: number, parent: Node) => void
  ): void;
}
