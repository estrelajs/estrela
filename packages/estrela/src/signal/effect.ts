import { onDestroy, onInit } from '../hooks';
import { EstrelaTemplate } from '../template';
import { ReadonlySignal, Effect, Cleanup, EffectOptions } from '../types';

const signalToEffectsMap = new Map<ReadonlySignal<unknown>, Set<Effect>>();
const effectMetadataMap = new WeakMap<
  Effect,
  {
    cleanup?: Cleanup;
    iteration: number;
    options: EffectOptions;
  }
>();

let activeEffect: Effect | null = null;
let trackBlocked = false;

export function getActiveEffectMetadata() {
  return activeEffect ? effectMetadataMap.get(activeEffect)! : null;
}

function runEffect(fn: Effect): void {
  activeEffect = fn;
  const metadata = effectMetadataMap.get(fn)!;
  const cleanup = fn(metadata.iteration);
  metadata.iteration++;
  if (cleanup) {
    metadata.cleanup = cleanup;
  }
  activeEffect = null;
}

export function trackSignal(signal: ReadonlySignal<unknown>) {
  if (trackBlocked || !activeEffect) return;
  let effects = signalToEffectsMap.get(signal);
  if (!effects) {
    effects = new Set();
    signalToEffectsMap.set(signal, effects);
  }
  effects.add(activeEffect);
}

export function triggerEffectsForSignal(signal: ReadonlySignal<unknown>) {
  const effects = signalToEffectsMap.get(signal);
  effects?.forEach(fn => runEffect(fn));
}

/**
 * Creates a reactive effect that tracks dependencies and triggers updates when necessary.
 * @param fn The effect function which represents the reactive code that needs to be executed.
 * @returns A function that can be used to cleanup the effect.
 */
export function effect(fn: Effect, options?: EffectOptions): () => void {
  effectMetadataMap.set(fn, { iteration: 0, options: options ?? {} });

  if (EstrelaTemplate.hookContext) {
    onInit(() => runEffect(fn));
  } else {
    runEffect(fn);
  }

  const cleanup = () => {
    effectMetadataMap.get(fn)!.cleanup?.();
    effectMetadataMap.delete(fn);

    for (const [signal, effects] of signalToEffectsMap.entries()) {
      effects.delete(fn);
      if (effects.size === 0) {
        signalToEffectsMap.delete(signal);
      }
    }
  };

  if (EstrelaTemplate.hookContext) {
    onDestroy(cleanup);
  }

  return cleanup;
}

/**
 * All signals called from within will not be tracked by effects.
 * @param fn Function that wraps signals.
 * @returns The return value of the function.
 */
export function untrack<T>(fn: () => T): T {
  trackBlocked = true;
  const result = fn();
  trackBlocked = false;
  return result;
}
