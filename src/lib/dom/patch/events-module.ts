import { Module } from 'snabbdom';
import {
  EventEmitter,
  isEventEmitter,
  isObservableState,
  ObservableState,
} from '../../core';
import { toCamelCase } from '../../utils';
import { VirtualNode, VirtualNodeData } from '../virtual-node';

type EventFilter = (event: Event, element: HTMLElement) => boolean;

const EVENT_FILTERS: Record<string, EventFilter> = {
  alt(event) {
    return (event as MouseEvent).altKey;
  },
  ctrl(event) {
    return (event as MouseEvent).ctrlKey;
  },
  meta(event) {
    return (event as MouseEvent).metaKey;
  },
  shift(event) {
    return (event as MouseEvent).shiftKey;
  },
  prevent(event) {
    event.preventDefault();
    return true;
  },
  stop(event) {
    event.stopPropagation();
    return true;
  },
  stopImmediate(event) {
    event.stopImmediatePropagation();
    return true;
  },
  self(event, element) {
    return event.target === element;
  },
};

function invokeHandler(
  handler: (e: Event) => void | EventEmitter<any> | ObservableState<any>,
  event?: Event | CustomEvent
): void {
  const data = event instanceof CustomEvent ? event.detail : event;

  if (isEventEmitter(handler)) {
    // emit to event emitter
    handler.emit(data);
  } else if (isObservableState(handler)) {
    // push to state
    handler.next(data);
  } else if (typeof handler === 'function') {
    // call function handler
    handler(data);
  }
}

function handleEvent(event: Event, vnode: VirtualNode) {
  const name = event.type;
  const events = vnode.data.events;

  // call event handler(s) if exists
  if (events && events[name]) {
    const attrEvent = events[name];
    let permitted = attrEvent.filters.every(filter =>
      !event || !EVENT_FILTERS[filter]
        ? true
        : EVENT_FILTERS[filter](event, vnode.elm as HTMLElement)
    );

    if (permitted && attrEvent.accessor) {
      const accessor = toCamelCase(attrEvent.accessor).toLowerCase();
      const key = (event as KeyboardEvent).key?.toLowerCase() ?? '';
      permitted = key === accessor;
    }

    if (permitted) {
      invokeHandler(events[name].handler, event);
    }
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
        oldElm.removeEventListener(name, oldListener);
      }
    } else {
      for (name in oldEvents) {
        // remove listener if existing listener removed
        if (!events[name]) {
          oldElm.removeEventListener(name, oldListener);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (events && Object.keys(events).length > 0) {
    // reuse existing listener or create new
    const listener = (vnode.listener = oldVnode.listener || createListener());
    // update vnode for listener
    (listener as any).vnode = vnode;

    const addEventListener = (name: string) => {
      const event = events[name];
      elm.addEventListener(name, listener, {
        capture: event.filters.includes('capture'),
        once: event.filters.includes('once'),
        passive: event.filters.includes('passive'),
      });
    };

    // if element changed or added we add all needed listeners unconditionally
    if (!oldEvents) {
      for (name in events) {
        // add listener if element was changed or new listeners added
        addEventListener(name);
      }
    } else {
      for (name in events) {
        // add listener if new listener added
        if (!oldEvents[name]) {
          addEventListener(name);
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
