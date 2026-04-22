import db from './blockDB.js';

describe('block db edge styles', () => {
  it('should correctly identify edge thickness', () => {
    expect(db.edgeStrToThickness('-->')).toBe('normal');
    expect(db.edgeStrToThickness('-.->')).toBe('normal');
    expect(db.edgeStrToThickness('==>')).toBe('thick');
  });

  it('should correctly identify edge patterns', () => {
    expect(db.edgeStrToPattern('-->')).toBe('solid');
    expect(db.edgeStrToPattern('==>')).toBe('solid');
    expect(db.edgeStrToPattern('-.->')).toBe('dotted');
  });

  it('should correctly identify start and end arrows', () => {
    expect(db.edgeStrToEdgeStartData('<-->')).toBe('arrow_point');
    expect(db.edgeStrToEdgeData('<-->')).toBe('arrow_point');

    expect(db.edgeStrToEdgeStartData('<==>')).toBe('arrow_point');
    expect(db.edgeStrToEdgeData('<==>')).toBe('arrow_point');

    expect(db.edgeStrToEdgeStartData('-->')).toBe('arrow_open');
    expect(db.edgeStrToEdgeData('-->')).toBe('arrow_point');

    expect(db.edgeStrToEdgeData('--x')).toBe('arrow_cross');
    expect(db.edgeStrToEdgeData('--o')).toBe('arrow_circle');
  });
});
