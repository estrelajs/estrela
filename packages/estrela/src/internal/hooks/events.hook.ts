import {
  EventEmitter,
  isEventEmitter,
  isState,
  State,
} from '../../observables';
import { toCamelCase } from '../../utils';
import { getCurrentNodeData } from '../tools/node-data-store';
import { Hook, HookData } from './Hook';

type EventFilter = (event: Event, node: Node) => boolean;

const NODE_LISTENER_MAP = new WeakMap<Node, EventListener>();

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
  self(event, node) {
    return event.target === node;
  },
};

export const eventsHook: Hook = {
  insert: hook,
  update: hook,
  remove: hook,
};

function hook(node: Node, { prev, next }: HookData): void {
  const oldEvents = prev?.events;
  const events = next?.events;

  if (!oldEvents && !events) {
    return;
  }

  const listener = NODE_LISTENER_MAP.get(node) ?? createListener(node);
  NODE_LISTENER_MAP.set(node, listener);

  // remove existing listeners which no longer used
  if (oldEvents) {
    for (let name in oldEvents) {
      // remove listener if existing listener removed
      if (!events?.[name]) {
        node.removeEventListener(name, listener);
      }
    }
  }

  // add new listeners which has not already attached
  if (events) {
    // if element changed or added we add all needed listeners unconditionally
    for (let name in events) {
      // add listener if new listener added
      if (!oldEvents?.[name]) {
        const event = events[name];
        node.addEventListener(name, listener, {
          capture: event.filters.includes('capture'),
          once: event.filters.includes('once'),
          passive: event.filters.includes('passive'),
        });
      }
    }
  }
}

function createListener(node: Node) {
  return function handler(event: Event) {
    handleEvent(node, event);
  };
}

function handleEvent(node: Node, event: Event) {
  const data = getCurrentNodeData(node);
  const name = event.type;
  const events = data.events ?? {};

  // call event handler(s) if exists
  if (events[name]) {
    // invokeHandler(events[name], event);
    const attrEvent = events[name];
    let allowed = attrEvent.filters.every(filter =>
      !event || !EVENT_FILTERS[filter]
        ? true
        : EVENT_FILTERS[filter](event, node)
    );

    if (allowed && attrEvent.accessor) {
      const accessor = toCamelCase(attrEvent.accessor).toLowerCase();
      const key = (event as KeyboardEvent).key?.toLowerCase() ?? '';
      allowed = key === accessor;
    }

    if (allowed) {
      invokeHandler(events[name].handler, event);
    }
  }
}

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
