import { escape } from 'html-escaper';
import { Component } from '../../core';
import { isObservableState } from '../../core/observable';
import { isFalsy } from '../../utils';
import { f, h, t, VData, VElement, VFragment, VNode } from '../vnode';
import { HTMLTemplateResult } from './template-builder';

// Token Regex
const TOKEN_REGEX = /^{{(\d+)}}$/;

export function buildVNode({ html, tokens }: HTMLTemplateResult): VFragment {
  const elements: VNode[] = [f([])];

  const getParent = () => {
    return elements[elements.length - 1] as VElement;
  };

  for (let index = 0; index < html.length; index++) {
    if (html[index] === '<') {
      let Component: Component | null = null;
      let [match, isClosingTag, tagName, attrs, isSelfClosing] =
        /^<(\/)?([^\s\/>]+)([^\/>]*)(\/)?>/s.exec(html.substring(index)) ?? [];

      // check tag function
      if (/^{{\d+}}$/.test(tagName)) {
        const index = tagName.replace(TOKEN_REGEX, '$1');
        Component = tokens[Number(index)] as Component;
      }

      // open tag
      if (!isClosingTag) {
        // push opened element
        const props = getAttributes(attrs, tokens);
        const node = Component ? h(Component, props) : h(tagName, props, []);
        elements.push(node);
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
            })
            .map(token => t(token));

          // push tokens to parent
          getParent().children.push(...content);
        }

        // move index to the end of content
        index = index + match.length - 1;
      }
    }
  }

  return getParent() as VFragment;
}

function getAttributes(attrs: string, tokens: unknown[]): VData {
  const result: Record<string, any> = {};
  const attrRegex = /([^\s=]+)="([^'"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrs))) {
    let [, key, value] = match as any;

    if (TOKEN_REGEX.test(value)) {
      const index = value.replace(TOKEN_REGEX, '$1');
      value = tokens[Number(index)];
    }

    if (key === 'ref') {
      result[key] = value;
    } else {
      result[key] = isObservableState(value) ? value() : value;
    }
  }

  const { key, ref, ...props } = result;
  return { key, ref, props };
}

function parseValue(value: unknown): string {
  if (isFalsy(value)) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(v => parseValue(v)).join('');
  }
  return escape(String(value));
}
