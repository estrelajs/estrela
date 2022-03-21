export interface MorphDomOptions {
  getNodeKey?: (node: Node) => string | undefined;
  onBeforeNodeAdded?: (node: Node) => Node | false;
  onNodeAdded?: (node: Node) => Node;
  onBeforeElUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
  onElUpdated?: (el: HTMLElement) => void;
  onBeforeNodeDiscarded?: (node: Node) => boolean;
  onNodeDiscarded?: (node: Node) => void;
  onBeforeElChildrenUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
  childrenOnly?: boolean;
}
