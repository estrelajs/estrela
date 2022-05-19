import { State, Subscription } from '../../observables';
import { domApi } from '../domapi';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const NODE_SUBSCRIPTIONS_MAP = new WeakMap<Node, Subscription>();

export const bindHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = oldNode.element ?? node?.element;
  const oldBind = oldNode.data?.bind;
  const bind = node?.data?.bind;

  if (!element || !domApi.isHTMLElement(element) || oldBind === bind) {
    return;
  }

  if (oldBind !== bind) {
    if (oldBind) {
      NODE_SUBSCRIPTIONS_MAP.get(element)?.unsubscribe();
      NODE_SUBSCRIPTIONS_MAP.delete(element);
    }
    if (bind) {
      createBind(element, bind);
    }
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
  NODE_SUBSCRIPTIONS_MAP.set(element, subscription);
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
