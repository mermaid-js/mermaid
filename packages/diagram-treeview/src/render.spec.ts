import { expect } from 'vitest';
import { mermaidAPI } from '@mermaid-js/core/mermaidAPI.js';
import { ensureNodeFromSelector, jsdomIt } from '@mermaid-js/core/tests/util.js';

jsdomIt('preserves treeView icons after strict security sanitization', async () => {
  mermaidAPI.initialize({ securityLevel: 'strict' });

  const { svg } = await mermaidAPI.render(
    'tree-view-strict-icons',
    `---
config:
  treeView:
    showIcons: true
---
treeView-beta
  src/
    index.js`
  );

  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const iconNode = ensureNodeFromSelector('.treeView-node-icon', doc);
  ensureNodeFromSelector('path', iconNode);
  expect(doc.querySelector('use')).toBeNull();
});
