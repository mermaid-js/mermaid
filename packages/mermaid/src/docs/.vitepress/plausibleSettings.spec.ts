import { describe, expect, it } from 'vitest';
import { getPlausibleSettings } from './plausibleSettings.js';

describe('getPlausibleSettings', () => {
  it('reports mermaid.js.org to the self-hosted Plausible by default', () => {
    expect(getPlausibleSettings({})).toEqual({
      domain: 'mermaid.js.org',
      endpoint: 'https://p.mermaid.live/api/event',
    });
  });

  it('uses the docs hostname as the Plausible site', () => {
    expect(getPlausibleSettings({ DOCS_SITE_URL: 'https://mermaid.ai/open-source/' }).domain).toBe(
      'mermaid.ai'
    );
  });

  it('reads DOCS_PLAUSIBLE_ENDPOINT, ignoring an empty value', () => {
    expect(
      getPlausibleSettings({ DOCS_PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event' }).endpoint
    ).toBe('https://plausible.io/api/event');
    expect(getPlausibleSettings({ DOCS_PLAUSIBLE_ENDPOINT: '' }).endpoint).toBe(
      'https://p.mermaid.live/api/event'
    );
  });
});
