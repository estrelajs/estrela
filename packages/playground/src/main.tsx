import { createState, render } from 'estrela';
import { interval } from 'rxjs';
// import App from './App';
import './index.css';

const count$ = interval(1000);

function App() {
  const state = createState(count$);

  return (
    <div>
      <h1>Hello World</h1>
      <div>Count is {state.$}</div>
    </div>
  );
}

render(<App />, document.getElementById('app')!);
