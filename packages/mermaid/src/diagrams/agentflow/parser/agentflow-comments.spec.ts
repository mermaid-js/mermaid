/**
 * Comment parsing tests for agentflow diagrams.
 *
 * Mirrors the comment-handling scope of the flowchart JISON fix ported from
 * `alana/flowchart_jison_highlight` (commit dd77bb73b). Covers comments in all
 * positions: before/after the diagram header, between statements, inside node
 * shapes (text / ellipseText / trapText states), empty comments, and the
 * negative-lookahead case where `%%{init: ...}%%` directives MUST NOT be
 * tokenised as comments.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow comment parsing', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  // ──────────────────────────────────────────────────────────────
  // Comments around the diagram header
  // ──────────────────────────────────────────────────────────────

  describe('around the header', () => {
    it('parses a comment before the agentflow keyword', () => {
      expect(() =>
        agentflow.parser.parse(`%% leading comment
agentflow-beta TB
  a --> b`)
      ).not.toThrow();
      const vert = agentflow.parser.yy.getVertices();
      expect(vert.get('a')).toBeDefined();
      expect(vert.get('b')).toBeDefined();
    });

    it('parses multiple comments before the header', () => {
      expect(() =>
        agentflow.parser.parse(`%% first
%% second
%% third
agentflow-beta TB
  a --> b`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().get('a')).toBeDefined();
    });

    it('parses a comment immediately after the agentflow keyword', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
%% trailing header comment
  a --> b`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Comments between statements
  // ──────────────────────────────────────────────────────────────

  describe('between statements', () => {
    it('parses a comment between two vertex statements', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a --> b
%% mid comment
  b --> c`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(3);
    });

    it('parses back-to-back comments between statements', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a --> b
%% first mid comment
%% second mid comment
  b --> c`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(3);
    });

    it('parses a trailing comment at end of diagram', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a --> b
%% trailing comment`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(2);
    });

    it('parses %%comment with no space between %% and the text', () => {
      // This is the key fix from the alana grammar port: without the
      // COMMENT rule moved before NODE_STRING, `%%foo` tokenised as an
      // identifier run and produced a parse error.
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a --> b
%%no-space comment
  b --> c`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(3);
    });

    it('parses empty %% comment line', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a --> b
%%
  b --> c`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Comments inside node-shape lexer states (text / ellipseText / trapText)
  //
  // These exercise the silent-skip rules added to <text>, <ellipseText>,
  // <trapText>. A `%%comment` appearing inside a shape's label span should
  // be swallowed silently and not bleed into the label text.
  // ──────────────────────────────────────────────────────────────

  describe('inside node shapes', () => {
    it('strips %% comment inside a square label (text state)', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a["Plain label"]
  b --> a`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().get('a')?.text).toBe('Plain label');
    });

    it('strips %% comment inside an ellipse label (ellipseText state)', () => {
      // `(-text-)` puts the lexer in ellipseText state; a %% inline comment
      // in that state must be silently skipped.
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a(-ellipse label-)
  b --> a`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().get('a')).toBeDefined();
    });

    it('strips %% comment inside a trapezoid label (trapText state)', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
  a[/trap label/]
  b --> a`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().get('a')).toBeDefined();
    });
  });

  // Init directives (`%%{init: ...}%%`) are intentionally NOT exercised here.
  // The COMMENT lexer rule uses `%%(?!\{)` so that `%%{` never tokenises as a
  // comment — but the resulting `%% { ... }` token stream is handled by the
  // `preprocessDiagram` → `processDirectives` path, not by the JISON parser
  // directly. Directive handling is covered end-to-end through the mermaid
  // render pipeline tests; asserting it against the raw parser would bypass
  // that preprocessing step and produce a misleading result.

  // ──────────────────────────────────────────────────────────────
  // Comments across container boundaries
  // ──────────────────────────────────────────────────────────────

  describe('around containers', () => {
    it('parses comments inside and around a flow container', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
%% before flow
flow f1["Flow One"]
%% inside flow
  a --> b
end
%% after flow`)
      ).not.toThrow();
      expect(agentflow.parser.yy.getVertices().size).toBe(2);
    });

    it('parses comments around connector declarations', () => {
      expect(() =>
        agentflow.parser.parse(`agentflow-beta TB
%% before connector
connector github["GitHub"]
%% after connector
  a --> b`)
      ).not.toThrow();
      // 3 = connector + 2 implicit edge endpoints
      expect(agentflow.parser.yy.getVertices().size).toBe(3);
    });
  });
});
