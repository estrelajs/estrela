import { createState } from '../state';

export interface RouterState {
  url: string;
  href: string;
  fragment: string;
  queryParams: URLSearchParams;
  state: any;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

const getState = ({ state = {} }: Partial<RouterState> = {}): RouterState => {
  return {
    url: window.location.pathname,
    href: window.location.href,
    fragment: window.location.hash,
    queryParams: new URLSearchParams(window.location.search),
    state,
  };
};

export const routerState = createState<RouterState>(getState());

window.addEventListener('popstate', () => {
  Object.assign(routerState, getState(routerState.state));
});

export function navigateTo(url: string, opts?: NavigateOptions) {
  const { replace = false, state = routerState.state } = opts ?? {};
  const action = replace ? 'replaceState' : 'pushState';
  window.history[action](state, '', url);
  Object.assign(routerState, getState({ ...routerState, state }));
}
