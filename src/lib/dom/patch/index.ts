import { attributesModule, classModule, init, styleModule } from 'snabbdom';

import { componentModule } from './component-module';

export const patch = init(
  [attributesModule, classModule, styleModule, componentModule],
  undefined,
  {
    experimental: { fragments: true },
  }
);
