import { isState, State, Subscription } from '../../core';
import { ComponentRef } from '../virtual-dom/component-ref';
import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();
const componentRefs = new WeakMap<Node, ComponentRef>();

function bindData(
  element: Node,
  target: string | undefined,
  state: any,
  event?: Event
): void {
  if (nodeApi.isDocumentFragment(element)) {
    if (event && isState(state)) {
      const customEvent = event as CustomEvent;
      state.next(customEvent.detail);
    } else if (target) {
      componentRefs.get(element)?.setProp(target, state);
    }
    return;
  }

  const bindValue = (getName: string, setName: string, setValue?: any) => {
    const elm = element as any;
    if (event && isState(state)) {
      state.next(elm[target ?? getName]);
    } else {
      elm[target ?? setName] = setValue ?? state;
    }
  };

  switch (element.nodeName.toLowerCase()) {
    case 'input':
      const input = element as HTMLInputElement;

      switch (input.type) {
        case 'checkbox':
          bindValue('checked', 'checked', Boolean(state));
          break;

        case 'date':
        case 'time':
          bindValue('valueAsDate', 'value');
          break;

        case 'number':
          bindValue('valueAsNumber', 'value');
          break;

        case 'radio':
          bindValue('checked', 'value', state === input.value);
          break;

        default:
          bindValue('value', 'value', String(state ?? ''));
          break;
      }
      break;

    case 'select':
      const select = element as HTMLSelectElement;
      if (event && isState(state)) {
        const option = select.options.item(select.selectedIndex);
        state.next(option?.value);
      } else {
        select.selectedIndex = Array.from(select.options).findIndex(
          option => option.value === state
        );
      }
      break;

    case 'textarea':
      bindValue('value', 'value', String(state ?? ''));
      break;

    default:
      if (target) {
        const elm = element as HTMLElement;
        if (event && isState(state)) {
          state.next((elm as any)[target]);
        } else {
          elm.setAttribute(target, String(state ?? ''));
        }
      }
      break;
  }
}

function createBind(
  element: Node,
  state: State<any>,
  key: string | undefined
): void {
  const subscription = state.subscribe(value => {
    bindData(element, key, value);
  });
  const handler = (e: Event) => {
    bindData(element, key, state, e);
  };
  element.addEventListener(key ?? 'input', handler);
  const unsubscribe = () => {
    element.removeEventListener(key ?? 'input', handler);
  };
  subscription.add({ unsubscribe });
  subscriptons.set(key ?? element, subscription);
}

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = oldNode.element ?? node?.element;
  const oldBinds = oldNode.data?.binds;
  const binds = node?.data?.binds;
  const oldBind = oldNode.data?.bind;
  const bind = node?.data?.bind;

  if (!element) {
    return;
  }

  if (node?.componentRef) {
    componentRefs.set(element, node.componentRef);
  }

  if (oldBind !== bind) {
    if (oldBind) {
      subscriptons.get(element)?.unsubscribe();
      subscriptons.delete(element);
    }
    if (bind) {
      createBind(element, bind, undefined);
    }
  }

  if (oldBinds !== binds) {
    for (let key in oldBinds) {
      const bind = oldBinds[key];
      if (bind !== binds?.[key]) {
        subscriptons.get(key)?.unsubscribe();
        subscriptons.delete(key);
      }
    }

    for (let key in binds) {
      const cur = binds[key];
      const old = oldBinds?.[key];
      if (cur !== old) {
        createBind(element, cur, key);
      }
    }
  }
}

export const bindHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
