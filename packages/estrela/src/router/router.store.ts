import { signalStore, withState } from '../store';

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

export const [{ url, href, fragment, queryParams, state }, update] =
  signalStore(withState<RouterState>(getState()));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    update(({ state }) => getState(state));
  });
}

function getState(nextState: any = {}): RouterState {
  return {
    url: window.location.pathname,
    href: window.location.href,
    fragment: window.location.hash,
    queryParams: new URLSearchParams(window.location.search),
    state: nextState,
  };
}

export function navigateTo(url: string, opts?: NavigateOptions) {
  const { replace = false, state: nextState = state() } = opts ?? {};
  const action = replace ? 'replaceState' : 'pushState';
  window.history[action](nextState, '', url);
  update(({ state }) => getState({ ...state, ...nextState }));
}
