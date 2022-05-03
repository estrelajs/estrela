import { Component } from '../core';
import { h } from '../dom';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

export const Link: Component<LinkProps> = ({ to }) => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo(to());
  }
  return h('a', { href: to, 'on:click': click }, h('slot', null));
};
