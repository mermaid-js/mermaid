/**
 * Diagnostic-layer tests for agentflow.
 *
 * Covers:
 * - `emitWarning` / `emitError` write to `getDiagnostics()` and `log`.
 * - Context (`nodeId` / `edgeId`) resolves to positions via the element
 *   mapping layer from PR 2a.
 * - `transformData`'s `SHAPE_UNSUPPORTED` warning reaches the diagnostic
 *   layer when a DB is passed in.
 * - `clear()` resets the diagnostic list.
 */

import { AgentFlowDB } from './agentflowDb.js';
import { AgentflowWarning } from './diagnostics.js';
import { log } from '../../logger.js';
import { setConfig } from '../../config.js';
import { transformData } from './transformData.js';
import agentflow from './parser/agentflowParser.js';
import type { LayoutData } from '../../rendering-util/types.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow diagnostics', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  describe('DB surface', () => {
    it('exposes emitWarning / emitError / getDiagnostics', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      expect(typeof db.emitWarning).toBe('function');
      expect(typeof db.emitError).toBe('function');
      expect(typeof db.getDiagnostics).toBe('function');
      expect(db.getDiagnostics()).toHaveLength(0);
    });
  });

  describe('emitWarning', () => {
    it('records a structured diagnostic with the given ID and message', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'bogus shape "foo"');
      const diagnostics = db.getDiagnostics();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe('SHAPE_UNSUPPORTED');
      expect(diagnostics[0].severity).toBe('warning');
      expect(diagnostics[0].message).toBe('bogus shape "foo"');
    });

    it('also writes to log.warn so console output is preserved', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'bogus shape "foo"');
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('SHAPE_UNSUPPORTED');
      expect(spy.mock.calls[0][0]).toContain('bogus shape "foo"');
      spy.mockRestore();
    });

    it('attaches a position from the element mapping when a nodeId is given', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'hypothetical', { nodeId: 'a' });
      const diag = db.getDiagnostics()[0];
      expect(diag.nodeId).toBe('a');
      expect(diag.position?.startLine).toBe(2);
    });

    it('leaves position undefined when no nodeId is given', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'no anchor');
      const diag = db.getDiagnostics()[0];
      expect(diag.nodeId).toBeUndefined();
      expect(diag.edgeId).toBeUndefined();
      expect(diag.position).toBeUndefined();
    });

    it('leaves position undefined when the referenced nodeId has no mapping', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'ghost node', { nodeId: 'never-seen' });
      const diag = db.getDiagnostics()[0];
      expect(diag.nodeId).toBe('never-seen');
      expect(diag.position).toBeUndefined();
    });

    it('accumulates multiple diagnostics in order', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'first');
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'second');
      expect(db.getDiagnostics().map((d) => d.message)).toEqual(['first', 'second']);
    });
  });

  describe('emitError', () => {
    it('records a diagnostic with severity=error and writes to log.error', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      const spy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      db.emitError(AgentflowWarning.SHAPE_UNSUPPORTED, 'boom');
      expect(spy).toHaveBeenCalledOnce();
      expect(db.getDiagnostics()[0].severity).toBe('error');
      spy.mockRestore();
    });
  });

  describe('SHAPE_UNSUPPORTED migration (transformData)', () => {
    it('emits SHAPE_UNSUPPORTED through emitWarning when a DB is passed', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      const fakeData: LayoutData = {
        nodes: [
          {
            id: 'n1',
            shape: 'bogus-shape',
            isGroup: false,
          } as unknown as LayoutData['nodes'][number],
        ],
        edges: [],
      } as unknown as LayoutData;
      transformData(fakeData, db);
      const diagnostics = db.getDiagnostics();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe('SHAPE_UNSUPPORTED');
      expect(diagnostics[0].nodeId).toBe('n1');
      expect(diagnostics[0].message).toContain('bogus-shape');
      expect(fakeData.nodes[0].shape).toBe('roundedRect');
    });

    it('falls back to log.warn when no DB is passed', () => {
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      const fakeData: LayoutData = {
        nodes: [
          {
            id: 'n1',
            shape: 'bogus-shape',
            isGroup: false,
          } as unknown as LayoutData['nodes'][number],
        ],
        edges: [],
      } as unknown as LayoutData;
      transformData(fakeData);
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('bogus-shape');
      spy.mockRestore();
    });

    it('does not emit for supported shapes', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      const fakeData: LayoutData = {
        nodes: [
          {
            id: 'n1',
            shape: 'roundedRect',
            isGroup: false,
          } as unknown as LayoutData['nodes'][number],
          { id: 'n2', shape: 'diamond', isGroup: false } as unknown as LayoutData['nodes'][number],
        ],
        edges: [],
      } as unknown as LayoutData;
      transformData(fakeData, db);
      expect(db.getDiagnostics()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('clear() drops diagnostics', () => {
      const db = agentflow.parser.yy as AgentFlowDB;
      db.emitWarning(AgentflowWarning.SHAPE_UNSUPPORTED, 'x');
      expect(db.getDiagnostics()).toHaveLength(1);
      db.clear();
      expect(db.getDiagnostics()).toHaveLength(0);
    });
  });
});
