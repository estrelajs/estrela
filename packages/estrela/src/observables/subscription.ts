import { SubscriptionLike, TeardownLogic } from './types';

export interface Subscription extends SubscriptionLike {
  add(teardown: TeardownLogic): void;
}

export function createSubscription(teardown?: () => void): Subscription {
  const finalizers = new Set<TeardownLogic>();
  let closed = false;

  if (teardown) {
    finalizers.add(teardown);
  }

  return {
    get closed() {
      return closed;
    },
    add(teardown) {
      if (!closed) {
        finalizers.add(teardown);
      }
    },
    unsubscribe() {
      if (!closed) {
        closed = true;
        finalizers.forEach(finalizer => {
          if (typeof finalizer === 'function') {
            finalizer();
          } else {
            finalizer.unsubscribe();
          }
        });
        finalizers.clear();
      }
    },
  };
}
