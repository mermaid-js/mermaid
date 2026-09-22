import { describe, it, expect, vi, afterEach } from 'vitest';
import * as diagramAPI from '../../diagram-api/diagramAPI.js';
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

describe('block db runtime config', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    db.clear();
  });

  it('should call getConfig at sanitization time, not at module load time', () => {
    const spy = vi.spyOn(diagramAPI, 'getConfig').mockReturnValue({} as any);

    db.setHierarchy([{ id: 'a', type: 'square', label: 'hello', children: [] }]);

    // getConfig must have been called during setHierarchy (call-time read),
    // not only once at module import time.
    expect(spy).toHaveBeenCalled();
  });
});
