import { Component } from '../core';
import { navigateTo } from './router.store';

export interface LinkProps {
  to: string;
}

export const Link: Component<LinkProps> = ({ to }) => {
  function click(e: MouseEvent) {
    e.preventDefault();
    navigateTo(to());
  }
  return (
    <a href={to()} on:click={click}>
      <slot />
    </a>
  );
};
