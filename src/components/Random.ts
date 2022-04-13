import { Component, emitter, observable, state } from '../lib';
import { async } from '../lib/directives';
import { html } from '../lib/dom';
import classes from './Random.module.css';

interface RamdomProps {
  ms: number;
}

const Random: Component<RamdomProps> = ({ ms }) => {
  const complete = emitter<string>('complete');
  const random = state(Math.random());

  const list$ = observable<string[]>(subscriber => {
    setTimeout(() => {
      subscriber.next(['a', 'b', 'c']);
      subscriber.complete();
      complete.emit('ok');
    }, ms());
  });

  return html`
    <h3 class=${classes.title}>Random</h3>
    <div>Random is ${random}</div>
    <ul>
      ${() =>
        async(list$)?.map(item => html`<li>${item}</li>`) ??
        html`<li>Loading...</li>`}
    </ul>
  `;
};

export default Random;
