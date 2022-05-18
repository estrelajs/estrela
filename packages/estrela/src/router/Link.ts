import { h } from '../internal';
import { Component } from '../types/jsx';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

export const Link: Component<LinkProps> = props => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo(props.to);
  }
  return h('a', {
    children: h('slot', {}),
    href: () => props.to,
    'on:click': click,
  });
};
