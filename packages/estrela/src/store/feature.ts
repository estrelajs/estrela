export interface SignalStoreFeature {
  state: Record<string, any>;
}

/** Declares State for a Signal Store. */
export function withState<T extends Record<string, any>>(
  initialState: T
): { state: T } {
  return { state: initialState };
}
