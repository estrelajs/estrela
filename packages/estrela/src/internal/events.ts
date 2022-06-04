const listeners: Map<string, Map<Node, Function>> = new Map();

export function addEventListener(
  target: Node,
  event: string,
  listener: Function
): () => void {
  let eventMap = listeners.get(event);
  if (!eventMap) {
    eventMap = new Map();
    listeners.set(event, eventMap);
    window.addEventListener(event, handler);
  }
  eventMap.set(target, listener);
  return () => eventMap!.delete(target);
}

function handler(event: Event): void {
  if (!event.target) {
    return;
  }
  const listenersForEvent = listeners.get(event.type);
  if (listenersForEvent) {
    let target = event.target as Node | null;
    while (target) {
      const listener = listenersForEvent.get(target);
      if (listener) {
        listener(event);
      }
      target = target.parentNode;
    }
  }
}
