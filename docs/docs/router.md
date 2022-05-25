# Router

Estrela has a simple builtin router system to handle the routing of your application.

## Defining Routes

First, you need to define the routes of your application. Routes are defined with a dictionary of path and handler. To create routes, you can use `createRouter` and `withRoute` helper functions.

```jsx
import { createRouter, withRoute } from 'estrela/router';

const routes = createRouter(
  withRoute('/', <Home />),
  withRoute('/dashboard', <Dashboard />),
  withRoute('/about', <About />)
);
```

You can declare params in the path with `:` and the name of the param. You will receive those params as an object inside of the handler function.

```jsx
withRoute('/edit/:id', ({ id }) => <Edit id={id} />),
```

To add the routes to your template, use the `Router` component.

```jsx
function App() {
  return <Router routes={routes} />;
}
```

## Route Link

Create a link to a route using the `Link` component. It will navigate to the route by updating the navigation state instead of reloading the page.

```jsx
import { Link } from 'estrela/router';

<Link to="/about">About</Link>;
```

## Router Store

Router has a store to keep track of the current route. It exposes some states and actions to work with the router.

### States

- `routeUrl`: The current url of the route.
- `routeFragment`: The url fragment.
- `routeQueryParams`: The query params.
- `routeState`: The state of the current route.

All of these states are of `Observable` type. You can't push value but you can subscribe or select them to create another observable.

```js
import { createSelector } from 'estrela';
import { routeState } from 'estrela/router';

// Create a new observable to keep track of the route id.
const id = createSelector(routeState, state => state.id);
```

### Actions

- `navigateTo`: Navigate to a route.

You can provide route state to the `navigateTo` function.

```jsx
import { navigateTo } from 'estrela/router';

function navigateToHome(state) {
  navigateTo('/', state);
}
```
