import { h, template } from '../../internal';
import { Routes } from '../route';
import { url } from '../router.store';

export interface RouterProps {
  base?: string;
  routes: Routes;
}

export function Router(this: RouterProps) {
  const getRoute = (
    routes: Routes,
    url: string,
    base = '/'
  ): JSX.Element | null => {
    const baseRegex = new RegExp(`^${base}`);
    if (!routes || typeof routes !== 'object' || !baseRegex.test(url)) {
      return null;
    }

    const [path, query] = url.replace(new RegExp(`^${base}`), '/').split('?');
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
  };

  return h(template(''), {
    '0': {
      children: [[() => getRoute(this.routes, url(), this.base), null]],
    },
  });
}
