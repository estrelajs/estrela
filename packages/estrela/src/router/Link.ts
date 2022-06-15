import { h, template } from '../internal';
import { Component } from '../types/types';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

const _tmpl = template('<a></a>');

export const Link: Component<LinkProps> = props => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo(props.to.replace(/^\//, ''));
  }
  return h(_tmpl, {
    0: {
      children: [[() => props.children, null]],
      href: () => props.to.replace(/^\//, ''),
      'on:click': click,
    },
  });
};
