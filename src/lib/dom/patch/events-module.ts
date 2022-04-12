import { Module } from 'snabbdom';
import { VirtualNode, VirtualNodeData } from '../virtual-node';

type Listener<T> = (this: VirtualNode, ev: T, vnode: VirtualNode) => void;

type SomeListener<N extends keyof HTMLElementEventMap> =
  | Listener<HTMLElementEventMap[N]>
  | Listener<any>;

function invokeHandler<N extends keyof HTMLElementEventMap>(
  handler: SomeListener<N> | Array<SomeListener<N>>,
  vnode: VirtualNode,
  event?: Event
): void {
  if (typeof handler === 'function') {
    // call function handler
    (handler as any).call(vnode, event, vnode);
  } else if (typeof handler === 'object') {
    // call multiple handlers
    for (let i = 0; i < handler.length; i++) {
      invokeHandler(handler[i], vnode, event);
    }
  }
}

function handleEvent(event: Event, vnode: VirtualNode) {
  const name = event.type;
  const events = vnode.data.events;

  // call event handler(s) if exists
  if (events && events[name]) {
    invokeHandler(events[name].handler, vnode, event);
  }
}

function createListener() {
  return function handler(event: Event) {
    handleEvent(event, (handler as any).vnode);
  };
}

function updateEventListeners(
  oldVnode: VirtualNode,
  vnode?: VirtualNode
): void {
  const oldEvents = (oldVnode.data as VirtualNodeData).events;
  const oldListener = oldVnode.listener;
  const oldElm: Element = oldVnode.elm as Element;
  const events = vnode?.data.events;
  const elm: Element = vnode?.elm as Element;
  let name: string;

  // optimization for reused immutable handlers
  if (oldEvents === events) {
    return;
  }

  // remove existing listeners which no longer used
  if (oldEvents && oldListener) {
    // if element changed or deleted we remove all existing listeners unconditionally
    if (!events) {
      for (name in oldEvents) {
        // remove listener if element was changed or existing listeners removed
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (name in oldEvents) {
        // remove listener if existing listener removed
        if (!events[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (events) {
    // reuse existing listener or create new
    const listener = (vnode.listener = oldVnode.listener || createListener());
    // update vnode for listener
    (listener as any).vnode = vnode;

    // if element changed or added we add all needed listeners unconditionally
    if (!oldEvents) {
      for (name in events) {
        // add listener if element was changed or new listeners added
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (name in events) {
        // add listener if new listener added
        if (!oldEvents[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}

export const eventsModule: Module = {
  create: updateEventListeners as any,
  update: updateEventListeners as any,
  destroy: updateEventListeners as any,
};
