export interface Contributor {
  name: string;
  avatar: string;
}

export interface SocialEntry {
  icon: string | { svg: string };
  link: string;
}

export interface CoreTeam {
  name: string;
  // required to download avatars from GitHub
  github: string;
  avatar?: string;
  twitter?: string;
  mastodon?: string;
  sponsor?: string;
  website?: string;
  linkedIn?: string;
  title?: string;
  org?: string;
  desc?: string;
  links?: SocialEntry[];
}

export const knut: CoreTeam = {
  github: 'knsv',
  name: 'Knut Sveidqvist',
  title: 'Creator',
  twitter: 'knutsveidqvist',
  sponsor: 'https://github.com/sponsors/knsv',
};

export const plainTeamMembers: CoreTeam[] = [
  {
    github: 'NeilCuzon',
    name: 'Neil Cuzon',
  },
  {
    github: 'tylerlong',
    name: 'Tyler Liu',
  },
  {
    github: 'sidharthv96',
    name: 'Sidharth Vinod',
    twitter: 'sidv42',
    mastodon: 'https://techhub.social/@sidv',
    sponsor: 'https://github.com/sponsors/sidharthv96',
    linkedIn: 'sidharth-vinod',
    website: 'https://sidharth.dev',
  },
  {
    github: 'ashishjain0512',
    name: 'Ashish Jain',
  },
  {
    github: 'mmorel-35',
    name: 'Matthieu Morel',
    linkedIn: 'matthieumorel35',
  },
  {
    github: 'aloisklink',
    name: 'Alois Klink',
    linkedIn: 'aloisklink',
    website: 'https://aloisklink.com',
  },
  {
    github: 'pbrolin47',
    name: 'Per Brolin',
  },
  {
    github: 'Yash-Singh1',
    name: 'Yash Singh',
  },
  {
    github: 'GDFaber',
    name: 'Marc Faber',
    linkedIn: 'marc-faber',
  },
  {
    github: 'MindaugasLaganeckas',
    name: 'Mindaugas Laganeckas',
  },
  {
    github: 'jgreywolf',
    name: 'Justin Greywolf',
  },
  {
    github: 'IOrlandoni',
    name: 'Nacho Orlandoni',
  },
  {
    github: 'huynhicode',
    name: 'Steph Huynh',
  },
  {
    github: 'Yokozuna59',
    name: 'Reda Al Sulais',
  },
  {
    github: 'nirname',
    name: 'Nikolay Rozhkov',
  },
];
