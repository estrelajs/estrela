import { getState } from '../get-state';
import { h } from '../internal';
import { createSelector } from '../store';
import { Component } from '../types';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

export const Link: Component<LinkProps> = props => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo(props.to);
  }
  return h(
    'a',
    {
      href: createSelector(getState(props, 'to'), _to => _to),
      'on:click': click,
    },
    h('slot', null)
  );
};
