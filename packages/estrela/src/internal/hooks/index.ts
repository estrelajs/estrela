import { attributesHook } from './attributes.hook';
import { eventsHook } from './events.hook';
import { NodeHook } from './node-hook';

export const nodeHooks: NodeHook[] = [attributesHook, eventsHook];
