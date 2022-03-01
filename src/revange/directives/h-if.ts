import { HTMLResult } from '../template';
import { htmlDirective } from './html-directive';

export const hIf = (
  expression: boolean,
  _if: string | HTMLResult,
  _else?: string | HTMLResult
) => htmlDirective(({ render }) => render(expression ? _if : _else ?? ''));
