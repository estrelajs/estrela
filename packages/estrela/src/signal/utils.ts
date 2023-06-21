export class FunctionExt extends Function {
  constructor(f: Function) {
    super();
    return Object.setPrototypeOf(f, new.target.prototype);
  }
}
