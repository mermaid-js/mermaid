import { beforeEach, describe, expect, it } from 'vitest';
import { ClassDB } from './classDb.js';

describe('ClassDB.setDiagramId + lookUpDomId', () => {
  let db: ClassDB;
  beforeEach(() => {
    db = new ClassDB();
    db.addClass('User');
    db.addClass('Admin');
  });

  it('always prefixes domId with diagramId', () => {
    db.setDiagramId('mermaid-0');
    expect(db.lookUpDomId('User')).toMatch(/^mermaid-0-classId-User-\d+$/);
  });

  it('produces unique domIds for same class across different diagram IDs', () => {
    const db2 = new ClassDB();
    db2.addClass('User');

    db.setDiagramId('mermaid-0');
    db2.setDiagramId('mermaid-1');

    expect(db.lookUpDomId('User')).not.toBe(db2.lookUpDomId('User'));
  });

  it('resets diagramId on clear()', () => {
    db.setDiagramId('mermaid-0');
    db.clear();
    db.addClass('User');
    // After clear, diagramId is empty so no prefix is applied
    expect(db.lookUpDomId('User')).not.toContain('mermaid-0');
  });

  it('two class diagrams with identical class names produce zero duplicate IDs', () => {
    const db1 = new ClassDB();
    const db2 = new ClassDB();

    for (const db of [db1, db2]) {
      db.addClass('User');
      db.addClass('Admin');
    }

    db1.setDiagramId('mermaid-0');
    db2.setDiagramId('mermaid-1');

    const ids = [
      db1.lookUpDomId('User'),
      db1.lookUpDomId('Admin'),
      db2.lookUpDomId('User'),
      db2.lookUpDomId('Admin'),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
