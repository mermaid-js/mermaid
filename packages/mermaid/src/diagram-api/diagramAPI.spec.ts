import { detectType } from './detectType.js';
import { getDiagram, registerDiagram } from './diagramAPI.js';
import { addDiagrams } from './diagram-orchestration.js';
import type { DiagramDetector } from './types.js';
import { Diagram } from '../Diagram.js';
import { getConfig, reset } from '../config.js';
import type { MermaidConfig } from '../config.type.js';
import { it, describe, expect, beforeAll } from 'vitest';

addDiagrams();
beforeAll(async () => {
  await Diagram.fromText('sequenceDiagram');
});

describe('DiagramAPI', () => {
  it('should return default diagrams', () => {
    expect(getDiagram('sequence')).not.toBeNull();
  });

  it('should throw error if diagram is not defined', () => {
    expect(() => getDiagram('loki')).toThrowErrorMatchingInlineSnapshot(
      `[Error: Diagram loki not found.]`
    );
  });

  it('should handle diagram registrations', () => {
    expect(() => getDiagram('loki')).toThrowErrorMatchingInlineSnapshot(
      `[Error: Diagram loki not found.]`
    );
    expect(() => detectType('loki diagram')).toThrowErrorMatchingInlineSnapshot(
      `[UnknownDiagramError: No diagram type detected matching given configuration for text: loki diagram]`
    );
    const detector: DiagramDetector = (str: string) => {
      return /loki/.exec(str) !== null;
    };
    registerDiagram(
      'loki',
      {
        db: {},
        parser: {
          parse: (_text) => {
            return;
          },
        },
        renderer: {
          draw: () => {
            // no-op
          },
        },
        styles: {},
      },
      detector
    );
    expect(getDiagram('loki')).not.toBeNull();
    expect(detectType('loki diagram')).toBe('loki');
  });

  it('injects a mutable config getter into external diagrams', () => {
    reset();
    let injectedGetConfig: (() => MermaidConfig) | undefined;
    registerDiagram('scratchpad', {
      db: {},
      parser: { parse: () => undefined },
      renderer: { draw: () => undefined },
      styles: {},
      injectUtils: (_log, _setLogLevel, getConfigFn) => {
        injectedGetConfig = getConfigFn;
      },
    });

    // The pattern external diagrams copied from in-repo ones: fill in defaults, then read them.
    const conf = injectedGetConfig!();
    expect(Object.isFrozen(conf)).toBe(false);
    expect(() => {
      conf.sequence!.width = 1;
      delete conf.secure;
    }).not.toThrow();
    expect(conf.sequence!.width).toBe(1);

    // A fresh copy each call, and the writes never reach mermaid's own config.
    expect(injectedGetConfig!().sequence!.width).toBe(getConfig().sequence!.width);
    expect(getConfig().sequence!.width).not.toBe(1);
    expect(getConfig().secure).toBeDefined();
  });
});
