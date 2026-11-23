export interface TopBarBanner {
  label: string;
  button: string;
  href: string;
}

// Pacific time: PST is UTC-8 for the whole campaign.
const NOVEMBER_FLOW_START = Date.parse('2026-11-19T00:01:00-08:00');
const NOVEMBER_FLOW_END = Date.parse('2026-12-31T23:59:00-08:00');

export const getTopBarBanner = (now: Date, utmSource: string): TopBarBanner => {
  const time = now.getTime();
  if (time >= NOVEMBER_FLOW_START && time < NOVEMBER_FLOW_END) {
    const params = new URLSearchParams({
      utm_source: utmSource,
      utm_medium: 'banner_ad',
      utm_campaign: 'november_flow',
      redirect: '/flow/new',
    });
    return {
      label: 'AI workflows you can read, review, and run.',
      button: 'Try Mermaid Flow',
      href: `https://mermaid.ai/app/sign-up?${params.toString()}`,
    };
  }
  const params = new URLSearchParams({
    utm_medium: 'banner_ad',
    utm_campaign: 'oss_coupon',
    utm_source: utmSource,
    coupon: 'arDfyFT8',
  });
  return {
    label: 'Try Mermaid Advanced Editor — OSS users get 10% off with code JS26',
    button: 'Get started',
    href: `https://mermaid.ai/app/user/billing/checkout?${params.toString()}`,
  };
};
