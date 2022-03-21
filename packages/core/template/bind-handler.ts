import { AttrBind, ChangeEvent } from '../../types';
import { isNextObserver } from '../../utils';
import { StateSubject } from '../observables/StateSubject';

function createEventListener(
  element: Element,
  event: string,
  target: string,
  bind: AttrBind
): () => void;
function createEventListener(
  element: Element,
  event: string,
  listener: (e: Event) => void
): () => void;
function createEventListener(
  element: Element,
  event: string,
  listener: ((e: Event) => void) | string,
  bind?: AttrBind
): () => void {
  if (typeof listener === 'string') {
    const target = listener;
    listener = (e: Event) => e.target && bind!.data.next((e.target as any)[target]);
  }
  let _listener = listener;
  element.addEventListener(event, _listener);
  return () => element.removeEventListener(event, _listener);
}

export function bindHandler(
  element: Element,
  attr: string,
  state: StateSubject<any>,
  bind?: AttrBind,
  target?: string
): AttrBind {
  const createBind = (event: string, target: string): AttrBind => {
    if (!bind) {
      bind = { attr, data: state };
      bind.cleanup = createEventListener(element, event, target, bind);
    } else {
      bind.data = state;
    }
    return bind;
  };

  switch (element.localName) {
    case 'input':
      const input = element as HTMLInputElement;

      switch (input.type) {
        case 'checkbox':
          target ??= 'checked';
          input[target as 'checked'] = Boolean(state());
          return createBind('change', target);

        case 'date':
        case 'time':
          input[(target ?? 'value') as 'value'] = state();
          return createBind('input', target ?? 'valueAsDate');

        case 'number':
          input[(target ?? 'value') as 'value'] = state();
          return createBind('input', target ?? 'valueAsNumber');

        case 'radio':
          input[(target ?? 'checked') as 'checked'] = state() === input.value;
          return createBind('change', target ?? 'value');

        default:
          target ??= 'value';
          input[target as 'value'] = String(state() ?? '');
          return createBind('input', target);
      }

    case 'select':
      const select = element as HTMLSelectElement;
      select.selectedIndex = Array.from(select.options).findIndex(
        option => option.value === state()
      );
      if (!bind) {
        bind = { attr, data: state };
        const listener = (e: Event) => {
          const target = (e as ChangeEvent<HTMLSelectElement>).target;
          const option = target.options.item(target.selectedIndex);
          if (isNextObserver(bind!.data)) {
            bind!.data.next(option?.value);
          }
        };
        bind.cleanup = createEventListener(element, 'input', listener);
      } else {
        bind.data = state;
      }
      return bind;

    case 'textarea':
      target ??= 'value';
      const textarea = element as HTMLTextAreaElement;
      textarea[target as 'value'] = String(state() ?? '');
      return createBind('input', target);
  }

  return { attr, data: state };
}
