import { Output, ReadonlySignal } from './types';

export type PropsOf<T extends Object> = {
  [K in keyof T]: T[K] extends Output<infer U> ? U : ReadonlySignal<T[K]>;
};

/**
 * Extracts props from the component params as readonly signals.
 * @param props Component Props
 * @param defaults Default values for props
 * @returns Props as signals
 */
export function extractProps<T extends Object>(
  props: T,
  defaults: Partial<T> = {}
): PropsOf<T> {
  const merged: any = {};
  for (const key in props) {
    const prop = props[key];
    if (isOutput(prop)) {
      merged[key] = prop;
    } else {
      merged[key] = () => props[key] ?? defaults[key];
    }
  }
  return merged;
}

export function isOutput<T>(prop: any): prop is Output<T> {
  return typeof prop === 'function' && prop.type === 'output';
}
