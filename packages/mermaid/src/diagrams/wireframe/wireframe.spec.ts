import { describe, it, expect, beforeEach } from 'vitest';
import type { WireframeSection } from '@mermaid-js/parser';
import detector from './detector.js';
import { parser } from './parser.js';
import db from './db.js';

describe('wireframe diagram', () => {
  beforeEach(() => {
    db.clear();
    // @ts-expect-error - yy DB instance passed at runtime by Mermaid
    parser.parser.yy = db;
  });

  describe('detector', () => {
    it('should detect wireframe diagram keywords', () => {
      expect(detector.detector('wireframe "User Settings" size=dialog')).toBe(true);
      expect(detector.detector('  wireframe')).toBe(true);
      expect(detector.detector('WIREFRAME "Dashboard"')).toBe(true);
      expect(detector.detector('flowchart TD')).toBe(false);
      expect(detector.detector('sequenceDiagram')).toBe(false);
    });
  });

  describe('parser & state DB integration', () => {
    it('should parse diagram title and canvas size preset', async () => {
      const input = `wireframe "App Dashboard" size=tablet`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getCanvasSize()).toBe('tablet');
      expect(db.getCanvasDimensions()).toEqual({ width: 768, height: 1024 });
    });

    it('should default to desktop canvas size if size is omitted', async () => {
      const input = `wireframe "Simple App"`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getCanvasSize()).toBe('desktop');
      expect(db.getCanvasDimensions()).toEqual({ width: 1024, height: 768 });
    });

    it('should extract top action bar buttons with primary flags', async () => {
      const input = `wireframe "Settings"
actions [Cancel] ["*Save"]
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const actionBar = db.getActionBar();
      expect(actionBar).toBeDefined();
      expect(actionBar?.buttons).toHaveLength(2);
      expect(actionBar?.buttons[0].label).toBe('Cancel');
      expect(actionBar?.buttons[1].label).toBe('*Save');
    });

    it('should parse component hierarchy with section containers', async () => {
      const input = `wireframe "User Form"
section "Account Details"
  textfield "Username"
  password "Password"
  button "Submit"
end
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      const components = db.getComponents();
      expect(components).toHaveLength(1);

      const section = components[0] as WireframeSection;
      expect(section.$type).toBe('WireframeSection');
      expect(section.label).toBe('Account Details');
      expect(section.components).toHaveLength(3);
    });

    it('should handle accessibility titles and descriptions', async () => {
      const input = `wireframe "Accessible App"
accTitle: Main Form Title
accDescr: Accessibility description for screen readers
`;
      await expect(parser.parse(input)).resolves.not.toThrow();

      expect(db.getAccTitle()).toBe('Main Form Title');
      expect(db.getAccDescription()).toBe('Accessibility description for screen readers');
    });
  });
});
