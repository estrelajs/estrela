import { html } from '../../dom';
import { apply } from '../../utils';
import { Component } from '../types';

export interface ShowProps {
  when: boolean | (() => boolean);
}

export const Show: Component<ShowProps> = ({ when }) => {
  return () => {
    const show = apply(when());
    return show ? html`<slot></slot>` : html`<slot name="else"></slot>`;
  };
};
