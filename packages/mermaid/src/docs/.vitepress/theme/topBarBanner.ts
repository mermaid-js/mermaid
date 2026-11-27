export interface TopBarBanner {
  label: string;
  button: string;
  href: string;
}

interface Campaign {
  /** ISO timestamps with an offset; Pacific time is UTC-8 through the winter. */
  start?: string;
  end?: string;
  label: string;
  button: string;
  path: string;
  params: Record<string, string>;
}

const campaigns: Campaign[] = [
  {
    start: '2026-11-19T00:01:00-08:00',
    end: '2026-12-31T23:59:00-08:00',
    label: 'AI workflows you can read, review, and run.',
    button: 'Try Mermaid Flow',
    path: '/app/sign-up',
    params: { utm_campaign: 'november_flow', redirect: '/flow/new' },
  },
  {
    label: 'Try Mermaid Advanced Editor — OSS users get 10% off with code JS26',
    button: 'Get started',
    path: '/app/user/billing/checkout',
    params: { utm_campaign: 'oss_coupon', coupon: 'arDfyFT8' },
  },
];

const startOf = (campaign: Campaign) =>
  campaign.start ? Date.parse(campaign.start) : Number.NEGATIVE_INFINITY;
const endOf = (campaign: Campaign) =>
  campaign.end ? Date.parse(campaign.end) : Number.POSITIVE_INFINITY;

/** The running campaign that ends soonest wins, the same rule mermaid.live uses. */
export const getTopBarBanner = (now: Date, utmSource: string): TopBarBanner | undefined => {
  const time = now.getTime();
  const [campaign] = campaigns
    .filter((candidate) => startOf(candidate) <= time && time < endOf(candidate))
    .sort((a, b) => endOf(a) - endOf(b));
  if (!campaign) {
    return undefined;
  }
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: 'banner_ad',
    ...campaign.params,
  });
  return {
    label: campaign.label,
    button: campaign.button,
    href: `https://mermaid.ai${campaign.path}?${params.toString()}`,
  };
};
