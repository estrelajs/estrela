import { coerceObservable, Subscription } from '../../observables';
import { Classes } from '../../types/node-data';
import { coerceArray } from '../../utils';
import { domApi } from '../tools/domapi';
import { Hook, HookData } from './Hook';

const subscriptons = new Map<Node, Record<string, Subscription>>();

export const classesHook: Hook = {
  insert: hook,
  update: hook,
  remove: hook,
};

function hook(node: Node, { prev, next }: HookData): void {
  const oldClasses = prev?.classes;
  const classes = next?.classes;
  const oldKlass = prev?.class;
  const klass = next?.class;

  if (!domApi.isElement(node)) {
    return;
  }

  if (oldClasses !== classes) {
    bindClasses(node, oldClasses ?? {}, classes ?? {});
  }

  if (klass !== oldKlass) {
    let oldClasses: Classes = {};
    const map = subscriptons.get(node) ?? {};
    map[0]?.unsubscribe();

    if (klass) {
      const subscription = coerceObservable(klass).subscribe(value => {
        const classes = parseClass(value);
        bindClasses(node, oldClasses, classes);
        oldClasses = classes;
      });
      map[0] = subscription;
      subscriptons.set(node, map);
    }
  }
}

function bindClasses(node: Element, oldClasses: Classes, classes: Classes) {
  const map = subscriptons.get(node) ?? {};

  for (let name in oldClasses) {
    const klass = oldClasses[name];
    if (klass !== classes[name]) {
      map[name]?.unsubscribe();
      node.classList.remove(name);
    }
  }

  for (let name in classes) {
    const cur = classes[name];
    const old = oldClasses[name];
    if (cur !== old) {
      const subscription = coerceObservable(cur).subscribe(value => {
        const action = value ? 'add' : 'remove';
        node.classList[action](name);
      });
      map[name] = subscription;
      subscriptons.set(node, map);
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
