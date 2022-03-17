export interface DirectiveCallback<R> {
  directive: string;
  render: (hooks: DirectiveHooks) => R;
}

export interface DirectiveHooks {
  requestRender: () => void;
  useEffect: (callback: () => void | (() => void), dependencies: any[]) => void;
  useState: <T>(initialValue: T) => [T, (newValue: T) => void];
}
