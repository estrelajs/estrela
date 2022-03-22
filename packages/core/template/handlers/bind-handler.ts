import { AttrBind, ChangeEvent } from '../../../types';
import { isNextObserver } from '../../../utils';
import { StateSubject } from '../../observables/StateSubject';

export function bindHandler(
  element: Element,
  state: StateSubject<any>,
  bind?: AttrBind,
  target?: string
): AttrBind {
  const createBind = (event: string, target: string): AttrBind => {
    if (!bind) {
      bind = { data: state };
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
        bind = { data: state };
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

  return { data: state };
}

function createEventListener(
  element: Element,
  event: string,
  target: string,
  bind: AttrBind<StateSubject<any>>
): () => void;
function createEventListener(
  element: Element,
  event: string,
  listener: (e: Event) => void
): () => void;
function createEventListener(
  element: Element,
  event: string,
  targetOrListener: ((e: Event) => void) | string,
  bind?: AttrBind<StateSubject<any>>
): () => void {
  if (typeof targetOrListener === 'string') {
    const target = targetOrListener;
    const state = bind!.data;
    targetOrListener = (e: Event) =>
      e.target && state.next((e.target as any)[target]);
  }
  let _listener = targetOrListener;
  element.addEventListener(event, _listener);
  return () => element.removeEventListener(event, _listener);
}
