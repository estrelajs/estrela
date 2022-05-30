import { isEventEmitter, isState } from '../../observables';
import { EventHandler } from '../../types/types';
import { PROPS_SYMBOL } from '../symbols';
import { nodeApi } from '../node-api';
import { NodeHook } from './node-hook';

export const eventsHook: NodeHook = {
  mount(node) {
    handleNode(node, event => node.addEventListener(event, eventListener));
  },
  unmount(node) {
    handleNode(node, event => node.removeEventListener(event, eventListener));
  },
};

function handleNode(node: Node, fn: (event: string) => void): void {
  if (nodeApi.isTextElement(node)) {
    return;
  }
  const props = Reflect.getMetadata(PROPS_SYMBOL, node);
  for (let key in props) {
    if (key.startsWith('on:')) {
      fn(key.slice(3));
    }
  }
}

function eventListener(event: Event): void {
  const { currentTarget } = event;
  if (currentTarget) {
    const props = Reflect.getMetadata(PROPS_SYMBOL, currentTarget);
    const handler: EventHandler<any> = props[`on:${event.type}`];
    if (isState(handler) || isEventEmitter(handler)) {
      handler.next(event);
    } else if (typeof handler === 'function') {
      handler(event);
    }
  }
}
