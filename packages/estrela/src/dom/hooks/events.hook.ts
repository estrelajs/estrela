import { EventEmitter, isEventEmitter, isState, State } from '../../core';
import { toCamelCase } from '../../utils';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './types';

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
  handler: EventEmitter<any> | State<any> | ((e: Event) => void),
  event?: Event | CustomEvent
): void {
  const data = event instanceof CustomEvent ? event.detail : event;
  if (isEventEmitter(handler)) {
    // emit to event emitter
    handler.next(data);
  } else if (isState(handler)) {
    // push to state
    handler.next(data);
  } else if (typeof handler === 'function') {
    // call function handler
    handler(data);
  }
}

function handleEvent(event: Event, node: VirtualNode) {
  const name = event.type;
  const events = node.data?.events ?? {};

  // call event handler(s) if exists
  if (events[name]) {
    // invokeHandler(events[name], event);
    const attrEvent = events[name];
    let permitted = attrEvent.filters.every(filter =>
      !event || !EVENT_FILTERS[filter]
        ? true
        : EVENT_FILTERS[filter](event, node.element as HTMLElement)
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

function createListener(node: VirtualNode) {
  return function handler(event: Event) {
    handleEvent(event, node);
  };
}

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const oldEvents = oldNode.data?.events;
  const oldListener = oldNode.listener;
  const oldelement = oldNode.element as Element | undefined;
  const events = node?.data?.events;
  const element = node?.element as Element | undefined;
  let name: string;

  // remove existing listeners which no longer used
  if (oldelement && oldEvents && oldListener) {
    for (name in oldEvents) {
      // remove listener if existing listener removed
      if (!events?.[name]) {
        oldelement.removeEventListener(name, oldListener);
      }
    }
  }

  // add new listeners which has not already attached
  if (node && element && events) {
    // reuse existing listener or create new
    const listener = (node.listener = oldNode.listener || createListener(node));

    // if element changed or added we add all needed listeners unconditionally
    for (name in events) {
      // add listener if new listener added
      if (!oldEvents?.[name]) {
        const event = events[name];
        element.addEventListener(name, listener, {
          capture: event.filters.includes('capture'),
          once: event.filters.includes('once'),
          passive: event.filters.includes('passive'),
        });
      }
    }
  }
}

export const eventsHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
