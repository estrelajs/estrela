export interface Route {
  path: string;
  route: RouteElement;
}

export type Routes = Record<string, RouteElement>;

export type RouteElement<K extends string = string> =
  | JSX.Element
  | ((params: Record<K, string>, query: URLSearchParams) => JSX.Element);

export function withRoute<K extends string>(
  path: string,
  route: RouteElement<K>
): Route {
  return { path, route } as any;
}

export function createRouter(...routes: Route[]) {
  return routes.reduce((acc, route) => {
    acc[route.path] = route.route;
    return acc;
  }, {} as Routes);
}
