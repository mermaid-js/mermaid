import { generateId } from './erRenderer.js';
import { lineBreakRegex } from '../common/common.js';

describe('erRenderer', () => {
  describe('generateId', () => {
    it('should be deterministic', () => {
      const id1 = generateId('hello world', 'my-prefix');
      const id2 = generateId('hello world', 'my-prefix');

      expect(id1).toBe(id2);
    });
  });
});
describe('entity relationship diagram title rendering', () => {
  it('should render multi-line titles with \\n and <br> correctly', () => {
    const title = 'ER Diagram Title\nWith Newline<br>And Line Break';
    const normalizedTitle = title.replace(/\\n/g, '\n');
    const lines = normalizedTitle.split(lineBreakRegex);

    expect(lines).toEqual(['ER Diagram Title', 'With Newline', 'And Line Break']);
  });
});
