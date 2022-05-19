import { h } from '../internal';
import { createSelector } from '../observables';
import { Component } from '../types/jsx';
import { Routes } from './route';
import { routeUrl } from './router.store';

export interface RouterProps {
  routes: Routes;
}

export const Router: Component<RouterProps> = props => {
  function getRoute(url: string, routes: Routes): JSX.Element | null {
    const [path, query] = url.split('?');

    if (typeof routes !== 'object') {
      return null;
    }

    for (const [key, route] of Object.entries(routes)) {
      const keys: string[] = [];
      const paths = key.split('/').map(path => {
        const [, isKey, key, isOptional] =
          /^(:)?([^\?]+)(\?)?/.exec(path) ?? [];
        if (isKey) {
          keys.push(key);
          return '([^/]+)' + (isOptional ? '?' : '');
        }
        return path;
      });
      const regex = new RegExp(`^${paths.join('/')}$`);
      const match = regex.exec(path);

      if (match !== null) {
        const params = match.slice(1).reduce((params, value, index) => {
          if (keys[index]) {
            params[keys[index]] = value;
          }
          return params;
        }, {} as Record<string, string>);
        const queryParams = query
          ? new URLSearchParams(query)
          : new URLSearchParams();
        return typeof route === 'function' ? route(params, queryParams) : route;
      }
    }

    return null;
  }

  return h(null, {
    children: createSelector(routeUrl, props.$.routes, getRoute),
  });
};
