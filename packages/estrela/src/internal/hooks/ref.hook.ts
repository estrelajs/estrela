import { isState } from '../../observables';
import { domApi } from '../domapi';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './types';

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  const ref = node?.data?.ref ?? oldNode.data?.ref;
  if (!ref || !element || !domApi.isElement(element)) {
    return;
  }
  const next = node?.element ?? undefined;
  if (isState(ref)) {
    ref.next(next);
  } else {
    ref(next);
  }
}

export const refHook: Hook = {
  create: hook,
  remove: hook,
};
