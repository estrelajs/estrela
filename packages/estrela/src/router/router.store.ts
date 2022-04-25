import { createSelector, createStore } from '../core';

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

const store = createStore<RouterState>(getState());
export const routeUrl = createSelector(store, state => state.url);
export const routeFragment = createSelector(store, state => state.fragment);
export const routeQueryParams = createSelector(
  store,
  state => state.queryParams
);
export const routeState = createSelector(store, state => state.state);

window.addEventListener('popstate', () => {
  store.update(getState);
});

export function navigateTo(url: string, opts?: NavigateOptions) {
  const oldState = store.getState();
  const { replace = false, state = oldState.state } = opts ?? {};
  const action = replace ? 'replaceState' : 'pushState';
  window.history[action](state, '', url);
  store.update(prev => getState({ ...prev, state }));
}
