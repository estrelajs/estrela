import { State, Subscription } from '../../observables';
import { domApi } from '../tools/domapi';
import { Hook, HookData } from './Hook';

const subscriptons = new Map<Node, Subscription>();

export const bindHook: Hook = {
  insert: hook,
  update: hook,
  remove: hook,
};

function hook(node: Node, { prev, next }: HookData): void {
  const oldBind = prev?.bind;
  const bind = next?.bind;

  if (!domApi.isHTMLElement(node) || oldBind === bind) {
    return;
  }
  if (oldBind) {
    subscriptons.get(node)?.unsubscribe();
    subscriptons.delete(node);
  }
  if (bind) {
    createBind(node, bind);
  }
}

function bindElement(
  element: HTMLElement,
  event: string,
  state: State<any>,
  handler: (value: any) => void
): void {
  const subscription = state.subscribe(value => handler(value), {
    initialEmit: true,
  });
  element.addEventListener(event, handler);
  const unsubscribe = () => {
    element.removeEventListener(event, handler);
  };
  subscription.add({ unsubscribe });
  subscriptons.set(element, subscription);
}

function createBind(element: HTMLElement, state: State<any>) {
  switch (element.nodeName.toLowerCase()) {
    case 'input':
      const input = element as HTMLInputElement;

      switch (input.type) {
        case 'checkbox':
          bindElement(element, 'change', state, value => {
            if (value instanceof Event) {
              state.next(input.checked);
            } else {
              input.checked = Boolean(value);
            }
          });
          break;

        case 'date':
        case 'time':
          bindElement(element, 'change', state, value => {
            if (value instanceof Event) {
              state.next(input.valueAsDate);
            } else {
              input.value = value;
            }
          });
          break;

        case 'number':
          bindElement(element, 'input', state, value => {
            if (value instanceof Event) {
              state.next(input.valueAsNumber);
            } else {
              input.value = value;
            }
          });
          break;

        case 'radio':
          bindElement(element, 'change', state, value => {
            if (value instanceof Event) {
              state.next(input.value);
            } else {
              input.checked = value === input.value;
            }
          });
          break;

        default:
          bindElement(element, 'input', state, value => {
            if (value instanceof Event) {
              state.next(input.value);
            } else {
              input.value = value;
            }
          });
          break;
      }
      break;

    case 'select':
      const select = element as HTMLSelectElement;
      bindElement(element, 'change', state, value => {
        if (value instanceof Event) {
          const option = select.options.item(select.selectedIndex);
          state.next(option?.value);
        } else {
          select.selectedIndex = Array.from(select.options).findIndex(
            option => option.value === value
          );
        }
      });
      break;

    case 'textarea':
      bindElement(element, 'input', state, value => {
        if (value instanceof Event) {
          state.next(input.value);
        } else {
          input.value = value;
        }
      });
      break;
  }
}
