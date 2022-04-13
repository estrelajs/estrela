import { html } from '../../dom';
import { Component } from '../types';

export interface ShowProps {
  when: boolean | (() => boolean);
}

const Show: Component<ShowProps> = ({ when }) => {
  return () => {
    const handler = when();
    const show = typeof handler === 'boolean' ? handler : handler();
    return show ? html`<slot></slot>` : html`<slot name="else"></slot>`;
  };
};

export default Show;
