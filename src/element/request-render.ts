import { CURRENT_ELEMENT } from '../properties/tokens';

export function requestRender(): void {
  CURRENT_ELEMENT.context.requestRender();
}
