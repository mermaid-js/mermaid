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
    title: 'Developer',
  },
  {
    github: 'tylerlong',
    name: 'Tyler Liu',
    title: 'Developer',
  },
  {
    github: 'sidharthv96',
    name: 'Sidharth Vinod',
    title: 'Developer',
    twitter: 'sidv42',
    mastodon: 'https://techhub.social/@sidv',
    sponsor: 'https://github.com/sponsors/sidharthv96',
    linkedIn: 'sidharth-vinod',
    website: 'https://sidharth.dev',
  },
  {
    github: 'ashishjain0512',
    name: 'Ashish Jain',
    title: 'Developer',
  },
  {
    github: 'mmorel-35',
    name: 'Matthieu Morel',
    title: 'Developer',
    linkedIn: 'matthieumorel35',
  },
  {
    github: 'aloisklink',
    name: 'Alois Klink',
    title: 'Developer',
    linkedIn: 'aloisklink',
    website: 'https://aloisklink.com',
  },
  {
    github: 'pbrolin47',
    name: 'Per Brolin',
    title: 'Developer',
  },
  {
    github: 'Yash-Singh1',
    name: 'Yash Singh',
    title: 'Developer',
  },
  {
    github: 'GDFaber',
    name: 'Marc Faber',
    title: 'Developer',
    linkedIn: 'marc-faber',
  },
  {
    github: 'MindaugasLaganeckas',
    name: 'Mindaugas Laganeckas',
    title: 'Developer',
  },
  {
    github: 'jgreywolf',
    name: 'Justin Greywolf',
    title: 'Developer',
  },
  {
    github: 'IOrlandoni',
    name: 'Nacho Orlandoni',
    title: 'Developer',
  },
  {
    github: 'huynhicode',
    name: 'Steph Huynh',
    title: 'Developer',
  },
];
