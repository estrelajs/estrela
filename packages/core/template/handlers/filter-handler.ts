type EventFilter = (event: Event, element: HTMLElement) => Event | false;

const EVENT_FILTERS: Record<string, EventFilter> = {
  altkey(event) {
    return (event as MouseEvent).altKey ? event : false;
  },
  ctrlkey(event) {
    return (event as MouseEvent).ctrlKey ? event : false;
  },
  metakey(event) {
    return (event as MouseEvent).metaKey ? event : false;
  },
  shiftkey(event) {
    return (event as MouseEvent).shiftKey ? event : false;
  },
  prevent(event) {
    event.preventDefault();
    return event;
  },
  stop(event) {
    event.stopPropagation();
    return event;
  },
  stopimmediate(event) {
    event.stopImmediatePropagation();
    return event;
  },
  self(event, element) {
    return event.target === element ? event : false;
  },
};

export function eventFilterHandler<T>(
  value: Event,
  filters: string[],
  element: HTMLElement
): false | Event {
  return filters.reduce((event, filter) => {
    if (event && EVENT_FILTERS[filter]) {
      return EVENT_FILTERS[filter](event, element);
    }
    return event;
  }, value as false | Event);
}

export function styleFilterHandler(value: number, filter: string): string {
  return `${value}${filter}`;
}
