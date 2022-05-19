import { isState } from '../../observables';
import { domApi } from '../domapi';
import { Hook, HookData } from './Hook';

function hook(node: Node, { prev, next }: HookData): void {
  const ref = next?.ref ?? prev?.ref;
  if (!ref || !domApi.isElement(node)) {
    return;
  }
  if (isState(ref)) {
    ref.next(next ? node : undefined);
  } else {
    ref(next ? node : undefined);
  }
}

export const refHook: Hook = {
  create: hook,
  remove: hook,
};
