import type { LangiumParser } from 'langium';
import { describe, expect, it } from 'vitest';

import type { C4, C4Services } from '../src/language/index.js';
import { createC4Services } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives } from './test-util.js';

const c4Services: C4Services = createC4Services().C4;
const c4Parser: LangiumParser = c4Services.parser.LangiumParser;
const parse = (input: string) => c4Parser.parse<C4>(input);

describe('c4-beta', () => {
  describe('header', () => {
    it.each([`c4-beta`, `  c4-beta  `, `\tc4-beta\t`, `\nc4-beta\n`])(
      'should handle bare c4-beta header',
      (context: string) => {
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe('C4');
        expect(result.value.kind).toBeUndefined();
      }
    );

    it.each(['context', 'container', 'component', 'dynamic', 'deployment'])(
      'should handle the %s kind keyword',
      (kind: string) => {
        const result = parse(`c4-beta ${kind}\n`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.kind).toBe(kind);
      }
    );
  });

  describe('title and accessibilities', () => {
    it('should handle title, accTitle and accDescr', () => {
      const result = parse(`c4-beta context
        title sample title
        accTitle: sample accTitle
        accDescr: sample accDescr
      `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.title).toBe('sample title');
      expect(result.value.accTitle).toBe('sample accTitle');
      expect(result.value.accDescr).toBe('sample accDescr');
    });
  });

  describe('direction', () => {
    it.each(['TB', 'BT', 'LR', 'RL'])('should handle direction %s', (direction: string) => {
      const result = parse(`c4-beta context
        direction ${direction}
      `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.direction).toBe(direction);
    });
  });

  describe('elements', () => {
    it('should handle a person with name and description', () => {
      const result = parse(`c4-beta context
        person customer "Personal Banking Customer" "A customer of the bank."
      `);
      expectNoErrorsOrAlternatives(result);
      const element = result.value.elements[0];
      expect(element.kind).toBe('person');
      expect(element.id).toBe('customer');
      expect(element.name).toBe('Personal Banking Customer');
      expect(element.description).toBe('A customer of the bank.');
      expect(element.external).toBeFalsy();
    });

    it('should handle an external system', () => {
      const result = parse(`c4-beta context
        external system mainframe "Mainframe Banking System" "Stores core banking information."
      `);
      expectNoErrorsOrAlternatives(result);
      const element = result.value.elements[0];
      expect(element.kind).toBe('system');
      expect(element.id).toBe('mainframe');
      expect(element.external).toBe(true);
    });

    it('should handle a container with technology', () => {
      const result = parse(`c4-beta container
        container spa "Single-Page App" "Web UI" "JavaScript/Angular"
      `);
      expectNoErrorsOrAlternatives(result);
      const element = result.value.elements[0];
      expect(element.kind).toBe('container');
      expect(element.name).toBe('Single-Page App');
      expect(element.description).toBe('Web UI');
      expect(element.technology).toBe('JavaScript/Angular');
    });

    it('should handle tags on elements', () => {
      const result = parse(`c4-beta context
        system banking "Internet Banking System" :::web :::critical-path
      `);
      expectNoErrorsOrAlternatives(result);
      const element = result.value.elements[0];
      expect(element.tags).toEqual(['web', 'critical-path']);
    });

    it('should handle nested elements via braces', () => {
      const result = parse(`c4-beta context
        system big "Big System" {
            container spa "Single-Page App" "Web UI" "JavaScript/Angular"
        }
      `);
      expectNoErrorsOrAlternatives(result);
      const element = result.value.elements[0];
      expect(element.id).toBe('big');
      expect(element.children).toHaveLength(1);
      expect(element.children[0].kind).toBe('container');
      expect(element.children[0].id).toBe('spa');
    });
  });

  describe('relationships', () => {
    it('should handle a relationship with description', () => {
      const result = parse(`c4-beta context
        person customer "Customer"
        system banking "Banking"
        customer --> banking : "Views account balances using"
      `);
      expectNoErrorsOrAlternatives(result);
      const relationship = result.value.relationships[0];
      expect(relationship.sourceId).toBe('customer');
      expect(relationship.targetId).toBe('banking');
      expect(relationship.arrow).toBe('-->');
      expect(relationship.description).toBe('Views account balances using');
    });

    it('should handle a relationship with technology', () => {
      const result = parse(`c4-beta context
        banking --> mainframe : "Gets account information from" "XML/HTTPS"
      `);
      expectNoErrorsOrAlternatives(result);
      const relationship = result.value.relationships[0];
      expect(relationship.description).toBe('Gets account information from');
      expect(relationship.technology).toBe('XML/HTTPS');
    });

    it.each(['-->', '<--', '<-->'])('should handle the %s arrow', (arrow: string) => {
      const result = parse(`c4-beta context
        a ${arrow} b
      `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.relationships[0].arrow).toBe(arrow);
    });

    it('should handle a numbered step prefix', () => {
      const result = parse(`c4-beta dynamic
        1: spa --> api : "Submits credentials to"
      `);
      expectNoErrorsOrAlternatives(result);
      const relationship = result.value.relationships[0];
      expect(relationship.step).toBe(1);
      expect(relationship.sourceId).toBe('spa');
    });

    it('should handle tags on relationships', () => {
      const result = parse(`c4-beta context
        a --> b : "Calls" :::async
      `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.relationships[0].tags).toEqual(['async']);
    });
  });

  describe('styles', () => {
    it('should handle a style statement with a single entry', () => {
      const result = parse(`c4-beta context
        style web fill:#1168BD
      `);
      expectNoErrorsOrAlternatives(result);
      const style = result.value.styles[0];
      expect(style.tag).toBe('web');
      expect(style.entries).toHaveLength(1);
      expect(style.entries[0].key).toBe('fill');
      expect(style.entries[0].value).toBe('#1168BD');
    });

    it('should handle multiple comma-separated entries', () => {
      const result = parse(`c4-beta context
        style database fill:#438DD5, stroke:#3C7FC0, shape:cylinder
      `);
      expectNoErrorsOrAlternatives(result);
      const style = result.value.styles[0];
      expect(style.entries.map((e) => [e.key, e.value])).toEqual([
        ['fill', '#438DD5'],
        ['stroke', '#3C7FC0'],
        ['shape', 'cylinder'],
      ]);
    });

    it('should handle short hex colors and word values', () => {
      const result = parse(`c4-beta context
        style async line:dashed, color:#fff
      `);
      expectNoErrorsOrAlternatives(result);
      const style = result.value.styles[0];
      expect(style.entries.map((e) => [e.key, e.value])).toEqual([
        ['line', 'dashed'],
        ['color', '#fff'],
      ]);
    });

    it('should handle several style statements', () => {
      const result = parse(`c4-beta context
        style web fill:#1168BD
        style async line:dashed
      `);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.styles.map((s) => s.tag)).toEqual(['web', 'async']);
    });
  });

  describe('full example', () => {
    it('should parse a complete context diagram', () => {
      const result = parse(`c4-beta context
title Internet Banking System - System Context
direction TB

person customer "Personal Banking Customer" "A customer of the bank."
system banking "Internet Banking System" "Allows customers to view accounts."
external system mainframe "Mainframe Banking System" "Stores core banking information."
system big "Big System" {
    container spa "Single-Page App" "Web UI" "JavaScript/Angular"
}

customer --> banking : "Views account balances using"
banking --> mainframe : "Gets account information from" "XML/HTTPS"
banking <--> mainframe : "Syncs with"
`);
      expectNoErrorsOrAlternatives(result);
      const ast = result.value;
      expect(ast.kind).toBe('context');
      expect(ast.title).toBe('Internet Banking System - System Context');
      expect(ast.direction).toBe('TB');
      expect(ast.elements).toHaveLength(4);
      expect(ast.elements.map((e) => e.id)).toEqual(['customer', 'banking', 'mainframe', 'big']);
      expect(ast.elements[2].external).toBe(true);
      expect(ast.elements[3].children).toHaveLength(1);
      expect(ast.relationships).toHaveLength(3);
      expect(ast.relationships[2].arrow).toBe('<-->');
    });
  });
});
