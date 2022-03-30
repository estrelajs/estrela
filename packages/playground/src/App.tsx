import { Component, state } from 'estrela';
import { createRouter, withRoute, Router, Link } from 'estrela/router';

import ChildrenTest from './children-test/App';
import GithubTest from './github/App';

const Menu: Component = () => {
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
};

const routes = createRouter(
  withRoute('/', <Menu />),
  withRoute('/test', <ChildrenTest />),
  withRoute('/github', <GithubTest />)
);

const App: Component = () => {
  const r = state(routes);

  return <Router routes={r()} />;
};

export default App;
