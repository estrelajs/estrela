import { createRouter, Link, Router, withRoute } from 'estrela/router';
import ChildrenTest from './children-test/App';
import GithubApp from './github/App';
import TodoApp from './todo/App';
import SvgTest from './svg-test/App';

const routes = createRouter(
  withRoute('/', () => <Menu />),
  withRoute('/github', () => <GithubApp />),
  withRoute('/svg', () => <SvgTest />),
  withRoute('/test', () => <ChildrenTest />),
  withRoute('/todo', () => <TodoApp />)
);

function Menu() {
  return (
    <>
      <h1>Examples</h1>
      <ul>
        <li>
          <Link to="/test">Test</Link>
        </li>
        <li>
          <Link to="/svg">SVG Test</Link>
        </li>
        <li>
          <Link to="/github">Github</Link>
        </li>
        <li>
          <Link to="/todo">Todo App</Link>
        </li>
      </ul>
    </>
  );
}

function App() {
  return <Router base="/estrela/" routes={routes} />;
}

export default App;
