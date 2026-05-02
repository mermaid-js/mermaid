// @mermaid-js/mermaid-interactive
//
// Preprocessor and post-render interaction binder for parameterised,
// interactive Mermaid diagrams.
//
// Usage (Node / build tools):
//   import { preprocess } from '@mermaid-js/mermaid-interactive';
//
// Usage (browser binder):
//   import { bind } from '@mermaid-js/mermaid-interactive/binder';

export { preprocess } from './preprocessor.js';
export { bind, parseInteractions } from './binder.js';
export type {
  InteractionDef,
  InteractionProps,
  ParamDef,
  PreprocessResult,
  Template,
} from './types.js';
