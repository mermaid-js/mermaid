import type { MessageCatalog } from './messages.js';

/**
 * Chinese (Simplified) messages.
 *
 * Typed against {@link MessageCatalog} so that adding a key to the English catalog
 * without translating it here is a compile error.
 */
export const zhCN: MessageCatalog = {
  'error.syntaxError': '文本语法错误',
  'error.version': 'mermaid 版本 {version}',
};
