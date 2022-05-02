import { h } from '../../dom';
import { createSelector } from '../../store';
import { Props } from '../types';

export interface ShowProps<T> {
  when: T | false | null | undefined;
  fallback?: JSX.Element;
  children: JSX.Children | ((item: NonNullable<T>) => JSX.Element);
}

export function Show<T>(props: Props<ShowProps<T>>) {
  const fragment = h();
  fragment.observable = createSelector(
    props.when,
    props.children,
    props.fallback,
    (c, child, fallback) => {
      if (c) {
        return typeof child === 'function' && child.length > 0
          ? (child as any)(c as T)
          : child;
      }
      return fallback;
    }
  );
  return fragment;
}
