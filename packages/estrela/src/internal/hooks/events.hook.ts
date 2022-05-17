import {
  EventEmitter,
  isEventEmitter,
  isState,
  State,
} from '../../observables';
import { toCamelCase } from '../../utils';
import { NodeData } from '../types';
import { Hook } from './Hook';

type EventFilter = (event: Event, element: HTMLElement) => boolean;

const NODE_LISTENER = new WeakMap<Node, EventListener>();

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
  create(node: Node, data: NodeData) {
    if (data.events) {
      const listener = NODE_LISTENER.get(node) ?? createListener(node, data);
      NODE_LISTENER.set(node, listener);

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
};

function createListener(node: Node, data: NodeData): EventListener {
  return function handler(event: Event) {
    handleEvent(event, node, data);
  };
}

function handleEvent(event: Event, node: Node, data: NodeData): void {
  const name = event.type;
  const events = data.events ?? {};

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
