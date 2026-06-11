import { describe, it, expect } from 'vitest';
import { replaceVersionPlaceholder } from './update-release-version.mjs';
import { MERMAID_RELEASE_VERSION } from './docs.mjs';

const placeholder = '<MERMAID_RELEASE_VERSION>';

describe('replaceVersionPlaceholder', () => {
  it('replaces a single placeholder with the current version', () => {
    const result = replaceVersionPlaceholder(`Available since ${placeholder}.`);
    expect(result).toBe(`Available since ${MERMAID_RELEASE_VERSION}.`);
  });

  it('replaces all occurrences of the placeholder', () => {
    const result = replaceVersionPlaceholder(`Since ${placeholder}. Also added in ${placeholder}.`);
    expect(result).toBe(
      `Since ${MERMAID_RELEASE_VERSION}. Also added in ${MERMAID_RELEASE_VERSION}.`
    );
    expect(result).not.toContain(placeholder);
  });

  it('leaves content unchanged when no placeholder is present', () => {
    const content = 'No placeholder here.';
    expect(replaceVersionPlaceholder(content)).toBe(content);
  });
});
