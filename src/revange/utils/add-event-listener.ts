import { Subject } from 'rxjs';

export function addEventListener(
  element: Element,
  event: string,
  listener: Function | Subject<unknown>
): () => void {
  const hook = (event: unknown) => {
    const data = event instanceof CustomEvent ? event.detail : event;
    if ((listener as any).next) {
      (listener as any).next(data);
    }
    if (typeof listener === 'function') {
      listener(data);
    }
  };
  element.addEventListener(event, hook);
  return () => element.removeEventListener(event, hook);
}
