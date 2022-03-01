import { HTMLResult, render } from '../template';

interface DirectiveCallbackParams {
  clear(): void;
  render(content: HTMLResult | string): void;
}

export function htmlDirective(cb: (params: DirectiveCallbackParams) => void) {
  return (virtualEl: HTMLDivElement) => {
    const div = document.createElement('div');
    const commentStart = document.createComment('');
    const commentEnd = document.createComment('');
    virtualEl.replaceWith(commentStart, commentEnd);

    const _clear = () => {
      const arr = Array.from(commentStart.parentNode?.childNodes ?? []);
      const a = arr.indexOf(commentStart);
      const b = arr.indexOf(commentEnd);
      if (a !== -1 && b !== -1) {
        arr.slice(a + 1, b).forEach(el => el.remove());
      }
    };

    const _render = (content: HTMLResult | string) => {
      _clear();
      render(content, div);
      div.childNodes.forEach(node =>
        commentStart.parentNode?.insertBefore(node, commentEnd)
      );
    };

    cb({ clear: _clear, render: _render });
  };
}
