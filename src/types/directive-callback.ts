import { HTMLTemplate } from './html-template';

export interface DirectiveCallback {
  (
    renderContent: (content: HTMLTemplate | HTMLTemplate[] | undefined) => void,
    hooks: {
      useEffect: (callback: () => void | (() => void), dependencies: any[]) => void;
      useState: <T>(initialValue: T) => [T, (newValue: T) => void];
    }
  ): void;
}
