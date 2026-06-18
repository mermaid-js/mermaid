import { hasNonEmptyAttributeType } from './erBox.js';

describe('erBox', () => {
  describe('hasNonEmptyAttributeType', () => {
    it('returns false when no attribute has a type', () => {
      expect(
        hasNonEmptyAttributeType([
          { type: '', name: 'firstName', keys: [], comment: '' },
          { type: '', name: 'lastName', keys: [], comment: '' },
        ])
      ).toBe(false);
    });

    it('returns true when any attribute has a type', () => {
      expect(
        hasNonEmptyAttributeType([
          { type: '', name: 'firstName', keys: [], comment: '' },
          { type: 'string', name: 'lastName', keys: [], comment: '' },
        ])
      ).toBe(true);
    });
  });
});
