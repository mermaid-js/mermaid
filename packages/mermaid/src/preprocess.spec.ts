import { describe, expect, it } from 'vitest';
import { preprocessDiagram } from './preprocess.js';

describe('preprocessDiagram', () => {
  describe('with a UTF-8 byte order mark', () => {
    it('should read front matter after the byte order mark', () => {
      const { title, config, code } = preprocessDiagram(
        '﻿---\ntitle: Hello\nconfig:\n  theme: forest\n---\nflowchart TD\nA-->B'
      );
      expect(title).toBe('Hello');
      expect(config).toEqual({ theme: 'forest' });
      expect(code.cleaned).toBe('flowchart TD\nA-->B');
    });

    it('should read front matter after the byte order mark with CRLF line endings', () => {
      const { title, code } = preprocessDiagram(
        '﻿---\r\ntitle: Hello\r\n---\r\nsequenceDiagram\r\nA->>B: hi'
      );
      expect(title).toBe('Hello');
      expect(code.cleaned).toBe('sequenceDiagram\nA->>B: hi');
    });

    it('should drop the byte order mark from a diagram without front matter', () => {
      const { code } = preprocessDiagram('﻿flowchart TD\nA-->B');
      expect(code.cleaned).toBe('flowchart TD\nA-->B');
    });
  });
});
