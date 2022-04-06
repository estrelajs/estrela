import { escape } from 'html-escaper';

import { isObservableState, ObservableState } from '../../observable';
import { isFalsy } from '../../utils';
import { HTMLTemplateResult } from './template-builder';

export type ElementProps<T extends Object = Record<string, string>> = Omit<
  T,
  'key' | 'ref'
> & {
  key?: string | number;
  ref?: ObservableState<any> | ((ref: any) => void);
};

export interface AstNode {
  tagName: string;
  props: ElementProps;
  children: AstChildNode[];
  isSelfClosing?: boolean;
}

export type AstChildNode = string | AstNode;

export function buildAst({ html, tokens }: HTMLTemplateResult): AstNode {
  const elements: AstChildNode[] = [
    {
      tagName: 'template',
      props: {},
      children: [],
    },
  ];

  const getParent = () => {
    return elements[elements.length - 1] as AstNode;
  };

  for (let index = 0; index < html.length; index++) {
    if (html[index] === '<') {
      let [match, isClosingTag, tagName, attrs, isSelfClosing] =
        /^<(\/)?([^\s\/>]+)([^\/>]*)(\/)?>/s.exec(html.substring(index)) ?? [];

      // // check tag function
      // if (/^{{\d+}}$/.test(tag)) {
      //   const index = Number(tag.replace(/^{{(\d+)}}$/, '$1'));
      //   const component = data[index] as EstrelaComponent;

      //   if (component.tag) {
      //     tag = component.tag;
      //   } else {
      //     tag = 'directive';
      //     directive = data[index] as ElementDirective<any>;
      //   }
      // }

      // open tag
      if (!isClosingTag) {
        // push opened element
        const props = getAttributes(attrs, tokens);
        elements.push({ tagName, props, children: [] });
      }

      // close tag
      if (isSelfClosing || isClosingTag) {
        const element = elements.pop();

        // if (typeof element === 'object') {
        //   element.isSelfClosing =
        //     !!isSelfClosing && /^[^-]+$/.test(element.tag);
        // }

        // push element to its parent
        getParent().children.push(element!);
      }

      // move index to the end of tag
      index = index + match.length - 1;
    } else {
      // get content between tags
      const [match] = /[^<]*/s.exec(html.substring(index)) ?? [];

      if (match) {
        // replace tokens with data
        const content = match.split(/({{\d+}})/g).map(token => {
          const tokenRegex = /^{{(\d+)}}$/;

          // if is not token - return it
          if (!tokenRegex.test(token)) {
            return token;
          }

          // get token value
          const index = token.replace(tokenRegex, '$1');
          const value = tokens[Number(index)];
          return parseValue(value);
        });

        // push tokens to parent
        getParent().children.push(...content);

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
    const tokenRegex = /^{{(\d+)}}$/;
    if (tokenRegex.test(value)) {
      const index = value.replace(tokenRegex, '$1');
      value = tokens[Number(index)];
    }
    result[key] = value;
  }
  return result;
}

function parseValue(value: unknown): string {
  value = isObservableState(value) ? value() : value;
  if (isFalsy(value)) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(v => parseValue(v)).join('');
  }
  return escape(String(value));
}
