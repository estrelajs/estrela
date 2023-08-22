import { h, template } from '../../template';
import { navigateTo } from '../router.store';

export interface LinkProps {
  children?: JSX.Children;
  to: string;
}

const _tmpl = template('<a></a>');

export function Link(this: LinkProps) {
  return h(_tmpl, {
    '1': {
      children: [[() => this.children, null]],
      href: () => this.to.replace(/^\//, ''),
      'on:click': (e: MouseEvent) => {
        e.preventDefault();
        navigateTo(this.to.replace(/^\//, ''));
      },
    },
  });
}
