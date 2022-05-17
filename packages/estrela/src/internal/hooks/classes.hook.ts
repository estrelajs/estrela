import { coerceObservable, Subscription } from '../../observables';
import { coerceArray } from '../../utils';
import { domApi } from '../domapi';
import { Classes } from '../types';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const subscriptons = new Map<any, Subscription>();

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
    bindClasses(oldClasses ?? {}, classes ?? {}, element);
  }

  if (klass !== oldKlass) {
    let oldClasses: Classes = {};
    subscriptons.get(element)?.unsubscribe();
    subscriptons.delete(element);

    if (klass) {
      const subscription = coerceObservable(klass).subscribe(value => {
        const classes = parseClass(value);
        bindClasses(oldClasses, classes, element);
        oldClasses = classes;
      });
      subscriptons.set(element, subscription);
    }
  }
}

function bindClasses(oldClasses: Classes, classes: Classes, element: Element) {
  for (let name in oldClasses) {
    const klass = oldClasses[name];
    if (klass !== classes[name]) {
      subscriptons.get(name)?.unsubscribe();
      subscriptons.delete(name);
      element.classList.remove(name);
    }
  }

  for (let name in classes) {
    const cur = classes[name];
    const old = oldClasses[name];
    if (cur !== old) {
      const subscription = coerceObservable(cur).subscribe(value => {
        const action = value ? 'add' : 'remove';
        element.classList[action](name);
      });
      subscriptons.set(name, subscription);
    }
  }
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

export const classesHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
