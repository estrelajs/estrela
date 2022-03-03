export interface DirectiveCallback<T> {
  (
    renderContent: (content: T | undefined) => void,
    hooks: {
      useEffect: (callback: () => void | (() => void), dependencies: any[]) => void;
      useState: <T>(initialValue: T) => [T, (newValue: T) => void];
    }
  ): void;
}
