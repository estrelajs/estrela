import { HTMLTemplate } from './html-template';

export interface DirectiveCallback {
  (
    requestRender: () => void,
    hooks: {
      useEffect: (callback: () => void | (() => void), dependencies: any[]) => void;
      useState: <T>(initialValue: T) => [T, (newValue: T) => void];
    }
  ): HTMLTemplate | HTMLTemplate[] | undefined;
}
