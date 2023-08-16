import { effect } from '../signal';
import { Signal } from '../types';
import { addEventListener } from './event-emitter';
import { NodeTrack } from './template-node';

export function binNode(
  node: Node,
  signal: Signal<unknown>,
  track?: NodeTrack
): void {
  const bind = bindProp(node, signal, track);

  if (node instanceof HTMLInputElement) {
    // checkbox
    if (node.type === 'checkbox') {
      bind(
        'change',
        () => node.checked,
        value => (node.checked = Boolean(value))
      );
    }

    // date
    if (node.type === 'date') {
      bind(
        'change',
        () => node.valueAsDate,
        value => (node.value = value ? value.toISOString().slice(11, 16) : '')
      );
    }

    // file
    if (node.type === 'file') {
      bind('change', () => node.files);
    }

    // number
    if (node.type === 'number') {
      bind(
        'input',
        () => node.valueAsNumber,
        value => (node.value = String(value) ?? '')
      );
    }

    // radio
    if (node.type === 'radio') {
      bind(
        'change',
        () => node.checked,
        value => (node.checked = node.value === String(value))
      );
    }

    // text
    if (node.type === 'text') {
      bind(
        'input',
        () => node.value,
        value => (node.value = String(value))
      );
    }
  }

  if (node instanceof HTMLSelectElement) {
    bind(
      'change',
      () => node.options.item(node.selectedIndex)?.value,
      value =>
        (node.selectedIndex = Array.from(node.options).findIndex(
          option => option.value === value
        ))
    );
  }

  if (node instanceof HTMLTextAreaElement) {
    bind(
      'input',
      () => node.value,
      value => (node.value = String(value))
    );
  }
}

export function bindProp(
  node: Node,
  signal: Signal<unknown>,
  track?: NodeTrack
) {
  return <T>(event: string, getter: () => T, setter?: (value: T) => void) => {
    const cleanup = addEventListener(node, event, () => signal.set(getter()));
    if (track) track.cleanup = cleanup;
    if (setter) {
      const fn = effect(() => setter(signal() as T));
      if (track)
        track.cleanup = () => {
          cleanup();
          fn();
        };
    }
  };
}
