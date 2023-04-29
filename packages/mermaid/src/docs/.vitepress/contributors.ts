import contributorUsernamesJson from './contributor-names.json';

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

const contributorUsernames: string[] = contributorUsernamesJson;

export const contributors = contributorUsernames.map((username) => {
  return { username, avatar: `/user-avatars/${username}.png` };
});

const websiteSVG = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-globe"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
};

const createLinks = (tm: CoreTeam): CoreTeam => {
  tm.avatar = `/user-avatars/${tm.github}.png`;
  tm.links = [{ icon: 'github', link: `https://github.com/${tm.github}` }];
  if (tm.mastodon) {
    tm.links.push({ icon: 'mastodon', link: tm.mastodon });
  }
  if (tm.twitter) {
    tm.links.push({ icon: 'twitter', link: `https://twitter.com/${tm.twitter}` });
  }
  if (tm.website) {
    tm.links.push({ icon: websiteSVG, link: tm.website });
  }
  if (tm.linkedIn) {
    tm.links.push({ icon: 'linkedin', link: `https://www.linkedin.com/in/${tm.linkedIn}` });
  }
  return tm;
};

const knut: CoreTeam = {
  github: 'knsv',
  name: 'Knut Sveidqvist',
  title: 'Creator',
  twitter: 'knutsveidqvist',
  sponsor: 'https://github.com/sponsors/knsv',
};

const plainTeamMembers: CoreTeam[] = [
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

const teamMembers = plainTeamMembers.map((tm) => createLinks(tm));
teamMembers.sort(
  (a, b) => contributorUsernames.indexOf(a.github) - contributorUsernames.indexOf(b.github)
);
teamMembers.unshift(createLinks(knut));

export { teamMembers };
