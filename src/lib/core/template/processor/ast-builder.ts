import { escape } from 'html-escaper';

import { isObservableState, ObservableState } from '../../observable';
import { isFalsy } from '../../utils';
import { HTMLTemplate } from '../html';
import { HTMLTemplateResult } from './template-builder';

export type ElementProps<T extends Object = Record<string, any>> = Omit<
  T,
  'key' | 'ref'
> & {
  key?: string | number;
  ref?: ObservableState<any> | ((ref: any) => void);
};

export interface AstNode {
  element: string | (() => HTMLTemplate);
  props: ElementProps;
  children: AstChildNode[];
}

export type AstChildNode = string | AstNode;

// Token Regex
const TOKEN_REGEX = /^{{(\d+)}}$/;

export function buildAst({ html, tokens }: HTMLTemplateResult): AstNode {
  const elements: AstChildNode[] = [
    {
      element: 'template',
      props: {},
      children: [],
    },
  ];

  const getParent = () => {
    return elements[elements.length - 1] as AstNode;
  };

  for (let index = 0; index < html.length; index++) {
    if (html[index] === '<') {
      let Component: (() => HTMLTemplate) | null = null;
      let [match, isClosingTag, tagName, attrs, isSelfClosing] =
        /^<(\/)?([^\s\/>]+)([^\/>]*)(\/)?>/s.exec(html.substring(index)) ?? [];

      // check tag function
      if (/^{{\d+}}$/.test(tagName)) {
        const index = tagName.replace(TOKEN_REGEX, '$1');
        Component = tokens[Number(index)] as () => HTMLTemplate;
      }

      // open tag
      if (!isClosingTag) {
        // push opened element
        const props = getAttributes(attrs, tokens);
        elements.push({
          element: Component ?? tagName,
          props,
          children: [],
        });
      }

      // close tag
      if (isSelfClosing || isClosingTag) {
        // push element to its parent
        const node = elements.pop();
        getParent().children.push(node!);
      }

      // move index to the end of tag
      index = index + match.length - 1;
    } else {
      // get content between tags
      const [match] = /[^<]*/s.exec(html.substring(index)) ?? [];

      if (match) {
        if (match.trim().length > 0) {
          // replace tokens with data
          const content = match
            .split(/({{\d+}})/g)
            .filter(token => token.trim().length > 0)
            .map(token => {
              // if is not token - return it
              if (!TOKEN_REGEX.test(token)) {
                return token;
              }

              // get token value
              const index = token.replace(TOKEN_REGEX, '$1');
              const value = tokens[Number(index)];
              return parseValue(value);
            });

          // push tokens to parent
          getParent().children.push(...content);
        }

        // move index to the end of content
        index = index + match.length - 1;
      }
    }
  }

  return getParent();
}

function getAttributes(attrs: string, tokens: unknown[]): ElementProps {
  const result: ElementProps = {};
  const attrRegex = /([^\s=]+)="([^'"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrs))) {
    let [, key, value] = match as any;

    if (TOKEN_REGEX.test(value)) {
      const index = value.replace(TOKEN_REGEX, '$1');
      value = tokens[Number(index)];
    }

    result[key] = isObservableState(value) ? value() : value;
  }
  return result;
}

function parseValue(value: unknown): string {
  // if (typeof value === 'function') {
  //   value = value();
  // }
  if (isFalsy(value)) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(v => parseValue(v)).join('');
  }
  return escape(String(value));
}
