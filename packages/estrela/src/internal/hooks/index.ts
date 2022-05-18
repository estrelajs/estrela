import { eventsHook } from './events.hook';
import { Hook } from './Hook';
import { stylesHook } from './styles.hook';

export const hooks: Hook[] = [
  // componentHook,
  // observableHook,
  // classesHook,
  stylesHook,
  // attrsHook,
  // refHook,
  // bindHook,
  eventsHook,
];
