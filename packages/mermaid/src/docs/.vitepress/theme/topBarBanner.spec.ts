import { describe, expect, it } from 'vitest';
import { getTopBarBanner } from './topBarBanner.js';

const campaignAt = (now: string) =>
  new URL(getTopBarBanner(new Date(now), 'mermaid_js').href).searchParams.get('utm_campaign');

describe('getTopBarBanner', () => {
  it('shows the JS26 coupon before 12:01 AM PT on November 19th', () => {
    expect(campaignAt('2026-11-19T00:00:59-08:00')).toBe('oss_coupon');
  });

  it('shows Mermaid Flow from November 19th to December 31st, Pacific time', () => {
    expect(campaignAt('2026-11-19T00:01:00-08:00')).toBe('november_flow');
    expect(campaignAt('2026-12-31T23:58:59-08:00')).toBe('november_flow');
  });

  it('goes back to the JS26 coupon at 11:59 PM PT on December 31st', () => {
    expect(campaignAt('2026-12-31T23:59:00-08:00')).toBe('oss_coupon');
  });

  it('sends Flow clicks through sign-up to a new Flow with the ticket UTMs', () => {
    const banner = getTopBarBanner(new Date('2026-11-23T12:00:00Z'), 'mermaid_js');
    expect(banner.label).toBe('AI workflows you can read, review, and run.');
    expect(banner.button).toBe('Try Mermaid Flow');
    expect(banner.href).toBe(
      'https://mermaid.ai/app/sign-up?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=november_flow&redirect=%2Fflow%2Fnew'
    );
  });
});
