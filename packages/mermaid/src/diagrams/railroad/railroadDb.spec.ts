import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './railroadDb.js';

describe('Railroad Database', () => {
  beforeEach(() => {
    db.clear();
  });

  it('should store and retrieve rules', () => {
    const rule = {
      name: 'test',
      definition: { type: 'terminal' as const, value: 'test' },
    };

    db.addRule(rule);
    expect(db.getRules()).toHaveLength(1);
    expect(db.getRule('test')).toEqual(rule);
  });

  it('should handle title', () => {
    db.setTitle('Test Title');
    expect(db.getTitle()).toBe('Test Title');
  });

  it('should clear state', () => {
    db.setTitle('Test');
    db.addRule({
      name: 'rule',
      definition: { type: 'terminal', value: 'test' },
    });

    db.clear();

    expect(db.getTitle()).toBe('');
    expect(db.getRules()).toHaveLength(0);
  });
});
