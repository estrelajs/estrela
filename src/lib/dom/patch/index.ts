import {
  init,
  attributesModule,
  classModule,
  styleModule,
  propsModule,
} from 'snabbdom';
import { componentModule } from './component-module';

export const patch = init(
  [componentModule, attributesModule, classModule, styleModule, propsModule],
  undefined,
  {
    experimental: { fragments: true },
  }
);
