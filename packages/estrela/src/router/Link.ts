import { $ } from '../hooks';
import { h } from '../internal';
import { createSelector } from '../store';
import { Component } from '../types';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

export const Link: Component<LinkProps> = ({ to }) => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo((to as any).$);
  }
  return h(
    'a',
    { href: createSelector($(to), _to => _to), 'on:click': click },
    h('slot', null)
  );
};
