import { vi, it, expect } from 'vitest';
import mermaidAPI from '../../../mermaidAPI.js';
import { initialize } from '../../../diagram-api/diagramAPI.js';
import * as logger from '../../../logger.js';

afterEach(() => {
  vi.restoreAllMocks();
});

it('warns when click is used without securityLevel "loose"', async () => {
  // Make the mock non-empty to satisfy @typescript-eslint/no-empty-function
  const warnSpy = vi.spyOn(logger, 'warn').mockImplementation((): void => {
    return undefined;
  });

  // Configure Mermaid to a non-loose security level
  initialize({ securityLevel: 'strict' });

  const diagram = `
    flowchart LR
      A-->B
      click A callback "Tip"
  `;

  // Render a diagram that uses "click" under strict security
  await mermaidAPI.render('test-click-warning', diagram);

  // Expect a helpful warning instead of silent failure
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('requires securityLevel: "loose"'));
});
