import {
  EventEmitter,
  isEventEmitter,
  isState,
  State,
} from '../../observables';
import { Events } from '../../types/data';
import { toCamelCase } from '../../utils';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

type EventFilter = (event: Event, element: HTMLElement) => boolean;

const EVENT_MAP = new WeakMap<Node, Events>();

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
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const oldEvents = oldNode.data?.events;
  const oldelement = oldNode.element as Element | undefined;
  const events = node?.data?.events;
  const element = node?.element as Element | undefined;
  let name: string;

  // remove existing listeners which no longer used
  if (oldelement && oldEvents) {
    for (name in oldEvents) {
      // remove listener if existing listener removed
      if (!events?.[name]) {
        oldelement.removeEventListener(name, eventListener, false);
      }
    }
  }

  // add new listeners which has not already attached
  if (node && element && events) {
    EVENT_MAP.set(element, events);

    // if element changed or added we add all needed listeners unconditionally
    for (name in events) {
      // add listener if new listener added
      if (!oldEvents?.[name]) {
        element.addEventListener(name, eventListener, false);
      }
    }
  }
}

function eventListener(event: Event) {
  const events = EVENT_MAP.get(event.target as Element);
  if (events) {
    const handler = events?.[event.type]?.handler;
    if (handler) {
      invokeHandler(handler, event);
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
