import { describe, expect, it } from 'vitest';
import { GitGraph } from '../src/language/index.js';
import { gitGraphParse as parse } from './test-util.js';

describe('gitGraph', () => {
  describe('Basic Parsing', () => {
    it('should handle empty gitGraph', () => {
      const result = parse(`gitGraph`);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.value.statements).toHaveLength(0);
    });

    it('should handle multiple commits', () => {
      const result = parse(`
        gitGraph
        commit
        commit
      `);
      expect(result.value.$type).toBe(GitGraph);
      expect(result.value.statements).toHaveLength(2);
      expect(
        result.value.statements.every((s: { $type: string }) => s.$type === 'Commit')
      ).toBeTruthy();
    });

    it('should handle branches and checkouts', () => {
      const result = parse(`
        gitGraph
        branch feature
        branch release
        checkout feature
      `);
      expect(result.value.statements).toHaveLength(3);
      expect(result.value.statements[0].$type).toBe('Branch');
      expect(result.value.statements[0].name).toBe('feature');
      expect(result.value.statements[1].$type).toBe('Branch');
      expect(result.value.statements[1].name).toBe('release');
      expect(result.value.statements[2].$type).toBe('Checkout');
      expect(result.value.statements[2].id).toBe('feature');
    });

    it('should handle merges', () => {
      const result = parse(`
        gitGraph
        branch feature
        commit id: "A"
        merge feature id: "M"
      `);
      expect(result.value.statements).toHaveLength(3);
      expect(result.value.statements[2].$type).toBe('Merge');
      expect(result.value.statements[2].name).toBe('feature');
      expect(result.value.statements[2].properties[0].id).toBe('M');
    });

    it('should handle cherry-picking with tags and parent', () => {
      const result = parse(`
        gitGraph
        branch feature
        commit id: "M"
        checkout main
        cherry-pick id: "M" tag: "v2.1:ZERO" parent:"ZERO"
      `);
      expect(result.value.statements).toHaveLength(4);
      expect(result.value.statements[3].$type).toBe('CherryPicking');
      expect(result.value.statements[3].properties.length).toBe(3);
      expect(result.value.statements[3].properties[0].id).toBe('M');
      expect(result.value.statements[3].properties[1].tags).toBe('v2.1:ZERO');
      expect(result.value.statements[3].properties[2].id).toBe('ZERO');
    });

    it('should parse complex gitGraph interactions', () => {
      const result = parse(`
        gitGraph
        commit id: "ZERO"
        branch feature
        branch release
        checkout feature
        commit id: "A"
        commit id: "B"
        checkout main
        merge feature id: "M"
        checkout release
        commit id: "C"
        cherry-pick id: "M" tag: "v2.1:ZERO" parent:"ZERO"
        commit id: "D"
      `);
      expect(result.value.statements).toHaveLength(12);
      expect(result.value.statements[0].$type).toBe('Commit');
      expect(result.value.statements[0].properties[0].id).toBe('ZERO');
      expect(result.value.statements[1].$type).toBe('Branch');
      expect(result.value.statements[6].$type).toBe('Merge');
      expect(result.value.statements[10].$type).toBe('CherryPicking');
      expect(result.value.statements[10].properties[0].id).toBe('M');
      expect(result.value.statements[10].properties[2].id).toBe('ZERO');
      expect(result.value.statements[11].$type).toBe('Commit');
      expect(result.value.statements[11].properties[0].id).toBe('D');
    });
  });
});
