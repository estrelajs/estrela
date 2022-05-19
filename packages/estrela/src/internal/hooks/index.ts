import { attrsHook } from './attrs.hook';
import { bindHook } from './bind.hook';
import { classesHook } from './classes.hook';
import { eventsHook } from './events.hook';
import { Hook } from './Hook';
import { refHook } from './ref.hook';
import { stylesHook } from './styles.hook';

export const hooks: Hook[] = [
  classesHook,
  stylesHook,
  attrsHook,
  eventsHook,
  bindHook,
  refHook,
];
