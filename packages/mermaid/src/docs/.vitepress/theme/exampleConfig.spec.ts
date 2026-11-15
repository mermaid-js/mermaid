import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { load } from 'js-yaml';
import { buildExampleConfig, getDiagramType, COLOR_THEME_DIAGRAMS } from './exampleConfig.js';

/**
 * Read as text rather than through the `?only-defaults` plugin, which is not registered for
 * the docs vitest project. This spec runs from more than one working directory.
 */
const schemaCandidates = [
  'packages/mermaid/src/schemas/config.schema.yaml', // repo root
  'src/schemas/config.schema.yaml', // packages/mermaid
  '../schemas/config.schema.yaml', // packages/mermaid/src/docs
].map((candidate) => resolve(process.cwd(), candidate));

const schemaPath = schemaCandidates.find((candidate) => existsSync(candidate));
if (!schemaPath) {
  throw new Error(`config.schema.yaml not found at any of: ${schemaCandidates.join(', ')}`);
}

const schema = load(readFileSync(schemaPath, 'utf8')) as {
  properties: Record<string, { $ref?: string }>;
  $defs: Record<string, { properties?: Record<string, { default?: unknown }> }>;
};

/** Diagram config keys whose section declares `theme: redux-color` in the schema. */
const declaredColourDefaults = Object.entries(schema.properties)
  .flatMap(([key, value]) => {
    const def = value.$ref?.replace('#/$defs/', '');
    const declared = def ? schema.$defs[def]?.properties?.theme?.default : undefined;
    return declared === 'redux-color' ? [key] : [];
  })
  .sort();

/** `buildExampleConfig`'s return, with the diagram sections it may add. */
type SectionedConfig = Record<string, { theme?: string; [option: string]: unknown } | undefined>;

describe('docs example config', () => {
  describe('light mode', () => {
    it('pins no theme or look, so examples show the defaults a reader gets', () => {
      const config = buildExampleConfig('flowchart TD\n  A --> B', false);
      expect(config.theme).toBeUndefined();
      expect(config.look).toBeUndefined();
    });
  });

  describe('dark mode', () => {
    it('gives every redesigned diagram type its dark counterpart', () => {
      const config = buildExampleConfig('flowchart TD\n  A --> B', true) as Record<
        string,
        { theme?: string }
      >;
      expect(config.theme).toBe('dark');
      for (const key of COLOR_THEME_DIAGRAMS) {
        expect(config[key]?.theme, `${key} kept the global dark theme`).toBe('redux-dark-color');
      }
    });

    it('still leaves `look` to the defaults', () => {
      expect(buildExampleConfig('flowchart TD\n  A --> B', true).look).toBeUndefined();
    });
  });

  it('names exactly the diagram types the schema defaults to a colour theme', () => {
    // The list in `exampleConfig.ts` is written out by hand. Deriving the expectation from
    // the schema is what stops the docs site quietly missing a tenth type added later.
    expect(declaredColourDefaults.length, 'no colour defaults found in the schema').toBeGreaterThan(
      0
    );
    expect([...COLOR_THEME_DIAGRAMS].sort()).toEqual(declaredColourDefaults);
  });

  describe('swimlane examples', () => {
    const swimlane = 'swimlane-beta LR\n  subgraph Customer\n  end';

    it('applies the layout options the syntax page should not repeat', () => {
      const config = buildExampleConfig(swimlane, false) as SectionedConfig;
      expect(config.swimlane).toMatchObject({
        ignoreCrossLaneEdges: true,
        optimizeRanksByCrossings: true,
      });
      expect(config.flowchart).toMatchObject({ titleTopMargin: 10 });
    });

    it('keeps the dark counterpart alongside them', () => {
      const config = buildExampleConfig(swimlane, true) as SectionedConfig;
      expect(config.swimlane).toMatchObject({
        theme: 'redux-dark-color',
        ignoreCrossLaneEdges: true,
      });
    });

    it('does not pin a theme or look of its own', () => {
      const config = buildExampleConfig(swimlane, false) as SectionedConfig;
      expect(config.theme).toBeUndefined();
      expect(config.look).toBeUndefined();
      expect(config.swimlane?.theme).toBeUndefined();
    });

    it('leaves other diagram types without the swimlane options', () => {
      const config = buildExampleConfig('flowchart TD\n  A --> B', false) as SectionedConfig;
      expect(config.swimlane).toBeUndefined();
      expect(config.flowchart).toBeUndefined();
    });
  });

  describe('getDiagramType', () => {
    it.each([
      ['swimlane-beta LR\n  A --> B', 'swimlane-beta'],
      ['---\nconfig:\n  look: neo\n---\nswimlane-beta LR', 'swimlane-beta'],
      ["%%{init: {'theme': 'forest'}}%%\nswimlane-beta LR", 'swimlane-beta'],
      ['flowchart TD\n  A --> B', 'flowchart'],
      ['  \n\nerDiagram\n  A ||--o{ B : has', 'erDiagram'],
    ])('reads the keyword out of %j', (source, expected) => {
      expect(getDiagramType(source)).toBe(expected);
    });
  });
});
