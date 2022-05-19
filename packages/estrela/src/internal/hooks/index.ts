import { attrsHook } from './attrs.hook';
import { bindHook } from './bind.hook';
import { classesHook } from './classes.hook';
import { componentHook } from './component.hook';
import { eventsHook } from './events.hook';
import { Hook } from './Hook';
import { observableHook } from './observable.hook';
import { refHook } from './ref.hook';
import { stylesHook } from './styles.hook';

export const hooks: Hook[] = [
  componentHook,
  observableHook,
  classesHook,
  stylesHook,
  attrsHook,
  refHook,
  bindHook,
  eventsHook,
];
