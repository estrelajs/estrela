import { createSelector, createState, render } from 'estrela';

function App(props: { title: string }) {
  const count = createState(0);

  setInterval(() => count.update(value => value + 1), 1000);

  return (
    <>
      <h1>Hello {props.title}!</h1>
      <DisplayCount count={() => count.$} />
    </>
  );
}

function DisplayCount(props: { count: number }) {
  createSelector(() => console.log(props.count));

  return <div>Count is {() => props.count}</div>;
}

render(<App title="world" />, document.getElementById('app')!);
