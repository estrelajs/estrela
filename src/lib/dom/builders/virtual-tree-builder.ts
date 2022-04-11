import { escape } from 'html-escaper';
import { Component } from '../../core';
import { isFalsy } from '../../utils';
import { buildAttributeData } from './attribute-builder';
import { createVirtualNode, VirtualNode } from '../virtual-node';
import { HTMLTemplateResult } from './template-builder';

// Token Regex
const TOKEN_REGEX = /^{{(\d+)}}$/;

export function buildVirtualTree({
  html,
  tokens,
}: HTMLTemplateResult): VirtualNode {
  const elements: VirtualNode[] = [createVirtualNode()];

  const getParent = () => {
    return elements[elements.length - 1] as VirtualNode;
  };

  for (let index = 0; index < html.length; index++) {
    if (html[index] === '<') {
      let Component: Component | null = null;
      let [match, isClosingTag, tagName, attrs, isSelfClosing] =
        /^<(\/)?([^\s\/>]+)([^\/>]*)(\/)?>/s.exec(html.substring(index)) ?? [];

      // check tag function
      if (TOKEN_REGEX.test(tagName)) {
        const index = tagName.replace(TOKEN_REGEX, '$1');
        Component = tokens[Number(index)] as Component;
      }

      // open tag
      if (!isClosingTag) {
        // push opened element
        const data = buildAttributeData(attrs, tokens, !!Component);
        const node = createVirtualNode(Component ?? tagName, data, []);
        elements.push(node);
      }

      // close tag
      if (isSelfClosing || isClosingTag) {
        // push element to its parent
        const node = elements.pop();
        getParent().children?.push(node!);
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
            .map(token => createVirtualNode(token));

          // push tokens to parent
          getParent().children?.push(...content);
        }

        // move index to the end of content
        index = index + match.length - 1;
      }
    }
  }

  return getParent();
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
