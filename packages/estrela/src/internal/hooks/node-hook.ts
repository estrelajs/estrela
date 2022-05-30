export interface NodeHook {
  create?(node: Node): void;
  mount?(node: Node): void;
  patch?(node: Node, props: any): void;
  unmount?(node: Node): void;
}
