import { coerceObservable, Subscription } from '../../observables';
import { Classes } from '../../types/data';
import { coerceArray } from '../../utils';
import { domApi } from '../domapi';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const NODE_SUBSCRIPTIONS_MAP = new WeakMap<
  Node,
  Record<string, Subscription>
>();

export const classesHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  const oldClasses = oldNode.data?.classes;
  const classes = node?.data?.classes;
  const oldKlass = oldNode.data?.class;
  const klass = node?.data?.class;

  if (!element || !domApi.isElement(element)) {
    return;
  }

  if (oldClasses !== classes) {
    bindClasses(element, oldClasses ?? {}, classes ?? {});
  }

  if (klass !== oldKlass) {
    let oldClasses: Classes = {};
    const map = NODE_SUBSCRIPTIONS_MAP.get(element) ?? {};
    map[0]?.unsubscribe();
    delete map[0];

    if (klass) {
      map[0] = coerceObservable(klass).subscribe(value => {
        const classes = parseClass(value);
        bindClasses(element, oldClasses, classes);
        oldClasses = classes;
      });
    }

    NODE_SUBSCRIPTIONS_MAP.set(element, map);
  }
}

function bindClasses(element: Element, oldClasses: Classes, classes: Classes) {
  const map = NODE_SUBSCRIPTIONS_MAP.get(element) ?? {};

  for (let name in oldClasses) {
    const klass = oldClasses[name];
    if (klass !== classes[name]) {
      map[name]?.unsubscribe();
      element.classList.remove(name);
      delete map[name];
    }
  }

  for (let name in classes) {
    const cur = classes[name];
    const old = oldClasses[name];
    if (cur !== old) {
      map[name] = coerceObservable(cur).subscribe(value => {
        const action = value ? 'add' : 'remove';
        element.classList[action](name);
      });
    }
  }

  NODE_SUBSCRIPTIONS_MAP.set(element, map);
}

function parseClass(klass: string | string[] | Classes): Classes {
  if (typeof klass !== 'string' && !Array.isArray(klass)) {
    return Object.keys(klass).reduce((acc, key) => {
      key.split(' ').forEach(name => {
        if (name.trim().length > 0) {
          acc[name.trim()] = klass[key];
        }
      });
      return acc;
    }, {} as Classes);
  }
  return coerceArray(klass).reduce((acc, className) => {
    className.split(' ').forEach(name => {
      if (name.trim().length > 0) {
        acc[name.trim()] = true;
      }
    });
    return acc;
  }, {} as Record<string, any>);
}
