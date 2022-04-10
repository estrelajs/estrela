import { init } from 'snabbdom';

import componentModule from './component-module';

export const patch = init([componentModule], undefined, {
  experimental: { fragments: true },
});
