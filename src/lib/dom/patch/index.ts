import {
  init,
  attributesModule,
  classModule,
  styleModule,
  propsModule,
} from 'snabbdom';
import { componentModule } from './component-module';
import { eventsModule } from './events-module';

export const patch = init(
  [
    componentModule,
    attributesModule,
    classModule,
    eventsModule,
    propsModule,
    styleModule,
  ],
  undefined,
  {
    experimental: { fragments: true },
  }
);
