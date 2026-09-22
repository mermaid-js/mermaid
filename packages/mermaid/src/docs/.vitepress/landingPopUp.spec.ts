import { describe, expect, it } from 'vitest';
import {
  landingPopUpStorageKey,
  markLandingPopUpSeen,
  shouldShowLandingPopUp,
} from './landingPopUp.js';

describe('landingPopUp', () => {
  it('shows on mermaid.js.org when never seen', () => {
    const visible = shouldShowLandingPopUp({
      hostname: 'mermaid.js.org',
      getLastSeen: () => null,
    });

    expect(visible).toBe(true);
  });

  it('shows on localhost when never seen', () => {
    const visible = shouldShowLandingPopUp({
      hostname: 'localhost',
      getLastSeen: () => null,
    });

    expect(visible).toBe(true);
  });

  it('does not show on non-mermaid.js hosts', () => {
    const visible = shouldShowLandingPopUp({
      hostname: 'mermaid.ai',
      getLastSeen: () => null,
    });

    expect(visible).toBe(false);
  });

  it('does not show when coming from mermaid.live', () => {
    const visible = shouldShowLandingPopUp({
      hostname: 'mermaid.js.org',
      referrer: 'https://mermaid.live/edit',
      getLastSeen: () => null,
    });

    expect(visible).toBe(false);
  });

  it('respects a 24 hour cooldown', () => {
    const now = Date.now();
    const recent = now - 23 * 60 * 60 * 1000;

    const visible = shouldShowLandingPopUp({
      hostname: 'mermaid.js.org',
      now,
      getLastSeen: () => String(recent),
    });

    expect(visible).toBe(false);
  });

  it('shows again after 24 hours', () => {
    const now = Date.now();
    const stale = now - 24 * 60 * 60 * 1000;

    const visible = shouldShowLandingPopUp({
      hostname: 'mermaid.js.org',
      now,
      getLastSeen: () => String(stale),
    });

    expect(visible).toBe(true);
  });

  it('records seen timestamp', () => {
    const writes: Record<string, string> = {};
    markLandingPopUpSeen((value: string) => {
      writes[landingPopUpStorageKey] = value;
    }, 12345);

    expect(writes[landingPopUpStorageKey]).toBe('12345');
  });
});
