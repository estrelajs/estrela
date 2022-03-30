import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

// Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
const raf =
  (typeof window !== 'undefined' &&
    window.requestAnimationFrame.bind(window)) ||
  setTimeout;
const nextFrame = function (fn: any) {
  raf(function () {
    raf(fn);
  });
};
let reflowForced = false;

function setNextFrame(obj: any, prop: string, val: any): void {
  nextFrame(function () {
    obj[prop] = val;
  });
}

function updateStyle(oldnode: VirtualNode, node: VirtualNode): void {
  const element = node.element;
  let oldStyles = oldnode.data?.styles;
  let styles = node.data?.styles;

  if (!element || !nodeApi.isElement(element)) return;
  if (oldStyles === styles) return;
  oldStyles = oldStyles ?? {};
  styles = styles ?? {};
  const oldHasDel = 'delayed' in oldStyles;

  for (let name in oldStyles) {
    if (!styles[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (element as any).style.removeProperty(name);
      } else {
        (element as any).style[name] = '';
      }
    }
  }
  for (let name in styles) {
    let cur = styles[name];
    if (name === 'delayed' && styles.delayed) {
      for (const name2 in styles.delayed) {
        cur = styles.delayed[name2];
        if (!oldHasDel || cur !== (oldStyles.delayed as any)[name2]) {
          setNextFrame((element as any).style, name2, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyles[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (element as any).style.setProperty(name, cur);
      } else {
        (element as any).style[name] = cur;
      }
    }
  }
}

function applyDestroyStyle(node: VirtualNode): void {
  let style: any;
  let name: string;
  const elm = node.element;
  const s = node.data?.styles;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    (elm as any).style[name] = style[name];
  }
}

function applyRemoveStyle(node: VirtualNode): void {
  applyDestroyStyle(node);

  const s = node.data?.styles;
  if (!s || !s.remove) {
    // rm();
    return;
  }
  if (!reflowForced) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (node.element as any).offsetLeft;
    reflowForced = true;
  }

  const element = node.element;
  let i = 0;
  const style = s.remove;
  let amount = 0;
  const applied: string[] = [];

  for (let name in style) {
    applied.push(name);
    (element as any).style[name] = style[name];
  }

  const compStyle = getComputedStyle(element as Element);
  const props = (compStyle as any)['transition-property'].split(', ');

  for (; i < props.length; ++i) {
    if (applied.indexOf(props[i]) !== -1) amount++;
  }

  (element as Element).addEventListener(
    'transitionend' as any,
    function (ev: TransitionEvent) {
      if (ev.target === element) --amount;
      // if (amount === 0) rm();
    }
  );
}

function forceReflow() {
  reflowForced = false;
}

export const stylesHook: Hook = {
  // pre: forceReflow,
  // destroy: applyDestroyStyle,
  create: updateStyle,
  update: updateStyle,
  remove: applyRemoveStyle,
};
