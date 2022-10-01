import mermaid from './mermaid';
import { mermaidAPI } from './mermaidAPI';
import './diagram-api/diagram-orchestration';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
const spyOn = vi.spyOn;

vi.mock('./mermaidAPI');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('when using mermaid and ', function () {
  describe('when detecting chart type ', function () {
    it('should not start rendering with mermaid.startOnLoad set to false', function () {
      mermaid.startOnLoad = false;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'init');
      mermaid.contentLoaded();
      expect(mermaid.init).not.toHaveBeenCalled();
    });

    it('should start rendering with both startOnLoad set', function () {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'init');
      mermaid.contentLoaded();
      expect(mermaid.init).toHaveBeenCalled();
    });

    it('should start rendering with mermaid.startOnLoad', function () {
      mermaid.startOnLoad = true;
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'init');
      mermaid.contentLoaded();
      expect(mermaid.init).toHaveBeenCalled();
    });

    it('should start rendering as a default with no changes performed', function () {
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>';
      spyOn(mermaid, 'init');
      mermaid.contentLoaded();
      expect(mermaid.init).toHaveBeenCalled();
    });
  });

  describe('when using #initThrowsErrors', function () {
    it('should accept single node', async () => {
      const node = document.createElement('div');
      node.appendChild(document.createTextNode('graph TD;\na;'));

      mermaid.initThrowsErrors(undefined, node);
      // mermaidAPI.render function has been mocked, since it doesn't yet work
      // in Node.JS (only works in browser)
      expect(mermaidAPI.render).toHaveBeenCalled();
    });
  });

  describe('checking validity of input ', function () {
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

    it('should throw for an invalid sequenceDiagram definition', function () {
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

    it('should return false for invalid definition WITH a parseError() callback defined', function () {
      let parseErrorWasCalled = false;
      mermaid.setParseErrorHandler(() => {
        parseErrorWasCalled = true;
      });
      expect(mermaid.parse('this is not a mermaid diagram definition')).toEqual(false);
      expect(parseErrorWasCalled).toEqual(true);
    });
  });
});
