import { signal } from 'estrela';

// import App from './App';
// import './index.css';

function App() {
  const count = signal(0);
  const timer = signal(0);
  const template = <div>My Template</div>;
  const colors = ['red', 'green', 'blue'];

  setInterval(() => {
    timer.set(timer() + 1);
  }, 1000);

  return (
    <>
      <h1>Hello World!</h1>
      <div>Item count: {count()}</div>
      <button
        style:color={colors[timer() % 3]}
        on:click={() => count.set(count() + 1)}
      >
        Add
      </button>
      <ul>
        {Array.from({ length: count() }).map((_, i) => (
          <li key={i}>Item {i + 1}</li>
        ))}
      </ul>
      <div>Timer: {timer()}</div>
      {template}
      {template}
    </>
  );

  // const template = <div>My Template</div>;
  // return (
  //   <>
  //     <h1>Hello World!</h1>
  //     {template}
  //     {template}
  //   </>
  // );
}

(<App />).mount(document.getElementById('app')!);
