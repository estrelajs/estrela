import { Component, createObservable, createSelector, state } from 'estrela';
import { render } from 'estrela/dom';

// count state
const count = state(0);
setInterval(() => count.update(v => v + 1), 1000);

// data observable
const data$ = createObservable<number[]>(subscriber =>
  setTimeout(() => subscriber.next([1, 2, 3]), 1000)
);

const App: Component = () => {
  return (
    <>
      <h1>Hello World!</h1>
      <div>Count is {count}</div>
    </>
  );
};

render(<App />, document.getElementById('app1')!);

render(
  <>
    <h1>Hello World!</h1>
    <div>Count is {count() * 2}</div>
  </>,
  document.getElementById('app2')!
);

render(
  <ul>{createSelector(data$, data => data.map(i => <li>{i}</li>))}</ul>,
  document.getElementById('app3')!
);
