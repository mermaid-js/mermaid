import mermaid from './mermaid';
import { getConfig, setConfig } from './config';
import { MermaidConfig } from './config.type';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

describe('mermaid', () => {
  const initialContent = '<div class="mermaid">graph TD;a</div>';

  beforeEach(() => {
    document.body.innerHTML = initialContent;
  });

  describe('#contentLoaded', () => {
    let startOnLoad: boolean;
    let initialConfig: MermaidConfig;

    beforeEach(() => {
      startOnLoad = mermaid.startOnLoad;
      initialConfig = getConfig();
    });

    afterEach(() => {
      mermaid.startOnLoad = startOnLoad;
      setConfig(initialConfig);
    });

    it('should render when mermaid.startOnLoad and config.startOnLoad are true', () => {
      mermaid.startOnLoad = true;
      setConfig({ startOnLoad: true });

      mermaid.contentLoaded();
      expect(document.body.innerHTML).not.toBe(initialContent);
    });

    it('should not render when mermaid.startOnLoad is false', () => {
      mermaid.startOnLoad = false;

      mermaid.contentLoaded();
      expect(document.body.innerHTML).toBe(initialContent);
    });

    it('should not render when config.startOnLoad is undefined', () => {
      setConfig({ startOnLoad: undefined });

      mermaid.contentLoaded();
      expect(document.body.innerHTML).toBe(initialContent);
    });

    it('should not render when config.startOnLoad set to false', () => {
      setConfig({ startOnLoad: false });

      mermaid.contentLoaded();
      expect(document.body.innerHTML).toBe(initialContent);
    });
  });

  describe('#initThrowsErrors', () => {
    it('should render', async () => {
      mermaid.initThrowsErrors(undefined, 'div');
      expect(document.body.innerHTML).not.toBe(initialContent);
    });
  });

  describe('#parse', () => {
    it('should throw for an invalid definition', function () {
      expect(() => mermaid.parse('this is not a mermaid diagram definition')).toThrow();
    });

    it('should not throw for a valid flow definition', function () {
      expect(() => mermaid.parse('graph TD;A--x|text including URL space|B;')).not.toThrow();
    });
    it('should throw for an invalid flow definition', function () {
      expect(() => mermaid.parse('graph TQ;A--x|text including URL space|B;')).toThrow();
    });

    it('should not throw for a valid sequenceDiagram definition (mmds1)', function () {
      const text =
        'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end';
      expect(() => mermaid.parse(text)).not.toThrow();
    });

    it('should throw for an invalid sequenceDiagram definition', () => {
      const text =
        'sequenceDiagram\n' +
        'Alice:->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end';
      expect(() => mermaid.parse(text)).toThrow();
    });

    it('should return false for invalid definition WITH a parseError() callback defined', () => {
      let parseErrorWasCalled = false;
      mermaid.setParseErrorHandler(() => {
        parseErrorWasCalled = true;
      });
      expect(mermaid.parse('this is not a mermaid diagram definition')).toEqual(false);
      expect(parseErrorWasCalled).toEqual(true);
    });
  });
});
