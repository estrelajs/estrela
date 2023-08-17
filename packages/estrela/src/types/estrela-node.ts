import { Listener } from '../internal';
import { EstrelaComponent } from './component';

export interface EstrelaNode {
  id?: string;
  template: EstrelaComponent | HTMLTemplateElement;

  get firstChild(): Node | null;
  get isConnected(): boolean;

  addEventListener(event: string, listener: Listener<unknown>): void;
  removeEventListener(event: string, listener: Listener<unknown>): void;
  inheritNode(node: EstrelaNode): void;
  mount(parent: Node, before?: Node | null): Node[];
  unmount(): void;
}
