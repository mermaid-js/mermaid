import { generateId } from './erRenderer';

describe('erRenderer', () => {
  describe('generateId', () => {
    it('should be deterministic', () => {
      const id1 = generateId('hello world', 'my-prefix');
      const id2 = generateId('hello world', 'my-prefix');

      expect(id1).toBe(id2);
    });
  });
});
