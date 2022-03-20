import { HTMLTemplate } from '../core';

export type HTMLTemplateLike =
  | string
  | number
  | false
  | HTMLTemplate
  | (string | number | false | HTMLTemplate | null | undefined)[]
  | null
  | undefined;
