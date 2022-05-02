import { createRouter, Link, Router, withRoute } from 'estrela/router';
import ChildrenTest from './children-test/App';
import GithubTest from './github/App';

const routes = createRouter(
  withRoute('/', () => <Menu />),
  withRoute('/test', () => <ChildrenTest />),
  withRoute('/github', () => <GithubTest />)
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
          <Link to="/github">Github</Link>
        </li>
      </ul>
    </>
  );
}

function App() {
  return <Router routes={routes} />;
}

export default App;
