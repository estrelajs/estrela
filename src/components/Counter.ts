import { Component } from '../lib';
import { html } from '../lib/dom';

interface CounterProps {
  count: number;
}

const Counter: Component<CounterProps> = ({ count }) => {
  return html`
    <h3 class="title">Counter</h3>
    <div>Count is ${count}</div>
  `;
};

export default Counter;
