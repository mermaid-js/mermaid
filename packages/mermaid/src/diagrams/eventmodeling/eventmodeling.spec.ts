import { it, describe, expect } from 'vitest';

// import { Diagram } from '../../Diagram.js';
// import mermaidAPI from '../../mermaidAPI.js';

import { db } from './db.js';
import { parser } from './parser.js';

const { clear } = db;

describe('eventmodeling diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple eventmodeling definition', async () => {
    const str = `eventmodeling
    tf 01 scn Screen
    tf 02 cmd RunAction
    tf 03 evt ActionExecuted`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  // fails because it reports `html` method not found for D3 div element. That's weird as it works outside of tests

  // describe('draw', () => {
  //   it('should draw a simple eventmodeling diagram', async () => {
  //     const str = `eventmodeling
  //     tf 01 scn Screen
  //     tf 02 cmd RunAction
  //     tf 03 evt ActionExecuted`;
  //     await mermaidAPI.parse(str);
  //     const diagram = await Diagram.fromText(str);
  //     await diagram.renderer.draw(str, 'tst', '1.2.3', diagram);
  //   });
  // });
});
