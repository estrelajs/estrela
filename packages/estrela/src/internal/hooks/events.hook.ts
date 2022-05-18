import {
  EventEmitter,
  isEventEmitter,
  isState,
  State,
} from '../../observables';
import { toCamelCase } from '../../utils';
import { Events } from '../types';
import { Hook } from './Hook';

type EventFilter = (event: Event, element: HTMLElement) => boolean;

const NODE_LISTENER_MAP = new WeakMap<Node, EventListener>();

const NODE_EVENTS_MAP = new WeakMap<Node, Events>();

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

export const eventsHook: Hook = {
  insert(node, data) {
    // add all listeners
    if (data.events) {
      const listener = NODE_LISTENER_MAP.get(node) ?? createListener(node);
      NODE_LISTENER_MAP.set(node, listener);
      NODE_EVENTS_MAP.set(node, data.events);

      for (let name in data.events) {
        const event = data.events[name];
        node.addEventListener(name, listener, {
          capture: event.filters.includes('capture'),
          once: event.filters.includes('once'),
          passive: event.filters.includes('passive'),
        });
      }
    }
  },
  update(node, data) {
    this.remove?.(node, data);
    this.insert?.(node, data);
  },
  remove(node, data) {
    const listener = NODE_LISTENER_MAP.get(node);
    if (listener && data.events) {
      for (let name in data.events) {
        node.removeEventListener(name, listener);
      }
    }
  },
};

function createListener(node: Node): EventListener {
  return function handler(event: Event) {
    handleEvent(event, node);
  };
}

function handleEvent(event: Event, node: Node): void {
  const events = NODE_EVENTS_MAP.get(node) ?? {};
  const name = event.type;

  // call event handler(s) if exists
  if (events[name]) {
    const attrEvent = events[name];
    let permitted = attrEvent.filters.every(filter =>
      !event || !EVENT_FILTERS[filter]
        ? true
        : EVENT_FILTERS[filter](event, node as HTMLElement)
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

function invokeHandler(
  handler: EventEmitter<any> | State<any> | ((e: Event) => void),
  event?: Event | CustomEvent
): void {
  const data = event instanceof CustomEvent ? event.detail : event;
  if (isEventEmitter(handler) || isState(handler)) {
    handler.next(data);
  } else if (typeof handler === 'function') {
    handler(data);
  }
}
