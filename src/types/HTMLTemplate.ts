import { HTMLResult } from '../element';

export type HTMLTemplate =
  | string
  | number
  | false
  | HTMLResult
  | (string | number | false | HTMLResult | null | undefined)[]
  | null
  | undefined;
