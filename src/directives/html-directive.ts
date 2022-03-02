import { render } from '../template';
import { HTMLTemplate } from '../types';

interface DirectiveCallback {
  (render: (content: HTMLTemplate) => void, clear: () => void): void;
}

export function htmlDirective(cb: DirectiveCallback) {
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

    const _render = (content: HTMLTemplate) => {
      _clear();
      render(content, div);
      div.childNodes.forEach(node =>
        commentStart.parentNode?.insertBefore(node, commentEnd)
      );
    };

    cb(_render, _clear);
  };
}
