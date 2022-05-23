export interface Options {
  /**
   * Create a proxy state inside of functional components.
   * Any variable declared inside of the functional component unsing the `let` keyword
   * will be transformed into a state.
   *
   * @default true
   */
  autoDeclareStates?: boolean;

  /**
   * Using `getState` with local variables will get its state reference from the proxy state.
   *
   * @requires autoDeclareStates
   * @default true
   */
  enableGetStateFunction?: boolean;

  /**
   * Suffix local variables with $ sign to get the state reference from the proxy state.
   *
   * @example
   * let count = 0;
   * count$.subscribe(console.log) // state of count
   *
   * @requires autoDeclareStates
   * @default true
   */
  getStateWithDolarSuffix?: boolean;
}
