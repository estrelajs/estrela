import { NodePath } from '@babel/core';
import { Options } from '../types';

export function getOptions(path: NodePath): Options {
  return (path.hub as any).file.metadata.config;
}
