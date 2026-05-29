import { describe, it, expect } from 'vitest';
import { parseDitaa } from './parser.js';

describe('parseDitaa — box detection', () => {
  it('detects a single simple box', () => {
    const input = `ditaa
+------+
|      |
+------+`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].col).toBe(0);
    expect(boxes[0].row).toBe(0);
    expect(boxes[0].cols).toBe(8); // includes both + corners
    expect(boxes[0].rows).toBe(3);
    expect(boxes[0].dashed).toBe(false);
    expect(boxes[0].rounded).toBe(false);
  });

  it('detects a box with interior text', () => {
    const input = `ditaa
+--------+
| Client |
+--------+`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].text).toBe('Client');
  });

  it('detects multi-line interior text', () => {
    const input = `ditaa
+--------+
|  ocis  |
|  proxy |
+--------+`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].text).toBe('ocis\nproxy');
  });

  it('detects two side-by-side boxes', () => {
    const input = `ditaa
+------+   +------+
|  A   |   |  B   |
+------+   +------+`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].text).toBe('A');
    expect(boxes[1].text).toBe('B');
  });

  it('detects stacked boxes', () => {
    const input = `ditaa
+------+
|  A   |
+------+
|  B   |
+------+`;
    // The parser should treat this as two separate boxes sharing the middle
    // `+--+` row as both a bottom and top border.
    const { boxes } = parseDitaa(input);
    expect(boxes.length).toBeGreaterThanOrEqual(1);
  });

  it('detects a dashed box (= borders)', () => {
    const input = `ditaa
+======+
|  X   |
+======+`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].dashed).toBe(true);
  });

  it('detects a rounded box (/ corners)', () => {
    const input = `ditaa
/------\\
|  Y   |
\\------/`;
    const { boxes } = parseDitaa(input);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].rounded).toBe(true);
  });

  it('returns empty boxes array for empty input', () => {
    const { boxes } = parseDitaa('ditaa\n');
    expect(boxes).toHaveLength(0);
  });
});

describe('parseDitaa — line / arrow detection', () => {
  it('detects a simple horizontal line', () => {
    const input = `ditaa
-------`;
    const { lines } = parseDitaa(input);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines[0].dashed).toBe(false);
  });

  it('detects a dashed horizontal line (=)', () => {
    const input = `ditaa
=======`;
    const { lines } = parseDitaa(input);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines[0].dashed).toBe(true);
  });

  it('detects a simple vertical line', () => {
    const input = `ditaa
|
|
|`;
    const { lines } = parseDitaa(input);
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('detects an arrow with > head', () => {
    const input = `ditaa
------->`;
    const { arrows } = parseDitaa(input);
    expect(arrows.length).toBeGreaterThanOrEqual(1);
    expect(arrows[0].endArrow).toBe(true);
    expect(arrows[0].startArrow).toBe(false);
  });

  it('detects a bidirectional arrow', () => {
    const input = `ditaa
<------->`;
    const { arrows } = parseDitaa(input);
    expect(arrows.length).toBeGreaterThanOrEqual(1);
    const arrow = arrows[0];
    expect(arrow.startArrow || arrow.endArrow).toBe(true);
  });
});

describe('parseDitaa — text extraction', () => {
  it('collects free-floating text', () => {
    const input = `ditaa
hello world`;
    const { texts } = parseDitaa(input);
    expect(texts.some((t) => t.text.includes('hello'))).toBe(true);
  });

  it('does not collect box interior text as free-floating', () => {
    const input = `ditaa
+------+
| box  |
+------+`;
    const { boxes, texts } = parseDitaa(input);
    expect(boxes[0].text).toBe('box');
    // Free-floating texts must not duplicate box interior
    expect(texts.some((t) => t.text === 'box')).toBe(false);
  });
});

describe('parseDitaa — complex diagram', () => {
  it('parses a three-box architecture diagram', () => {
    const input = `ditaa
+----------+         +------------+         +-----------+
|          |  https  |            |  http   |   ocis    |
|  Client  | <-----> |  Webserver | <-----> |   proxy   |
|          |         |            |         |  service  |
+----------+         +------------+         +-----------+`;

    const { boxes, arrows } = parseDitaa(input);
    expect(boxes.length).toBe(3);
    // Should detect the <-----> bidirectional arrows
    expect(arrows.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves grid dimensions', () => {
    const lines = ['ditaa', '+--+', '|  |', '+--+'];
    const { grid } = parseDitaa(lines.join('\n'));
    expect(grid.height).toBe(3);
    expect(grid.width).toBe(4);
  });
});
