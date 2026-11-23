import { describe, expect, it } from 'vitest';
import { getTopBarBanner } from './topBarBanner.js';

const bannerAt = (now: string) => getTopBarBanner(new Date(now), 'mermaid_js');

const campaignAt = (now: string) => {
  const href = bannerAt(now)?.href;
  return href && new URL(href).searchParams.get('utm_campaign');
};

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
    expect(bannerAt('2026-11-23T12:00:00Z')).toEqual({
      label: 'AI workflows you can read, review, and run.',
      button: 'Try Mermaid Flow',
      href: 'https://mermaid.ai/app/sign-up?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=november_flow&redirect=%2Fflow%2Fnew',
    });
  });

  it('keeps the JS26 coupon link', () => {
    expect(bannerAt('2027-01-15T12:00:00Z')).toEqual({
      label: 'Try Mermaid Advanced Editor — OSS users get 10% off with code JS26',
      button: 'Get started',
      href: 'https://mermaid.ai/app/user/billing/checkout?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=oss_coupon&coupon=arDfyFT8',
    });
  });
});
