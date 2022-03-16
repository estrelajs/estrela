import { HTMLResult } from '../core';

export type HTMLTemplate =
  | string
  | number
  | false
  | HTMLResult
  | (string | number | false | HTMLResult | null | undefined)[]
  | null
  | undefined;
