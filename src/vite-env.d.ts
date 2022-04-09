/// <reference types="vite/client" />

declare module 'postcss-prefix-selector' {
  import { AcceptedPlugin } from 'postcss';

  interface PrefixSelectorOptions {
    prefix: string;
    exclude?: string[];
    transform?: (
      prefix: string,
      selector: string,
      prefixedSelector: string
    ) => string;
  }

  export default function (props: PrefixSelectorOptions): AcceptedPlugin;
}
