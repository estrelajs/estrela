import { HTMLTemplate } from '../types';
import { htmlDirective } from './html-directive';

export const when = (
  condition: boolean,
  truthy: HTMLTemplate,
  falsy?: HTMLTemplate
) => htmlDirective(render => render(condition ? truthy : falsy ?? ''));
