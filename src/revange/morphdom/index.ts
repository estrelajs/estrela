import morphAttrs from './morphAttrs';
import morphdomFactory from './morphdom';

interface MorphDomOptions {
  getNodeKey?: (node: Node) => any;
  onBeforeNodeAdded?: (node: Node) => Node;
  onNodeAdded?: (node: Node) => Node;
  onBeforeElUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
  onElUpdated?: (el: HTMLElement) => void;
  onBeforeNodeDiscarded?: (node: Node) => boolean;
  onNodeDiscarded?: (node: Node) => void;
  onBeforeElChildrenUpdated?: (fromEl: HTMLElement, toEl: HTMLElement) => boolean;
  childrenOnly?: boolean;
}

interface MorphDomFunc {
  (fromNode: Node, toNode: Node | string, options?: MorphDomOptions): void;
}

var morphdom: MorphDomFunc = morphdomFactory(morphAttrs);

export default morphdom;
