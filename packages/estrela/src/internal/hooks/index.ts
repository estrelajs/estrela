import { componentHook } from './component.hook';
import { Hook } from './types';
import { observableHook } from './observable.hook';
import { eventsHook } from './events.hook';
import { attrsHook } from './attrs.hook';
import { bindHook } from './bind.hook';
import { classesHook } from './classes.hook';
import { stylesHook } from './styles.hook';
import { refHook } from './ref.hook';

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
