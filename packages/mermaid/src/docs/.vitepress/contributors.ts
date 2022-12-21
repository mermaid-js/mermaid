import contributorNames from './contributor-names.json';

export interface Contributor {
  name: string;
  avatar: string;
}

export interface SocialEntry {
  icon: string;
  link: string;
}

export interface CoreTeam {
  avatar: string;
  name: string;
  // required to download avatars from GitHub
  github: string;
  twitter: string;
  sponsor?: string;
  title?: string;
  org?: string;
  desc?: string;
  links?: SocialEntry[];
}

const contributorsAvatars: Record<string, string> = {};

const getAvatarUrl = (name: string) =>
  import.meta.hot ? `https://github.com/${name}.png` : `/user-avatars/${name}.png`;

export const contributors = (contributorNames as string[]).reduce((acc, name) => {
  contributorsAvatars[name] = getAvatarUrl(name);
  acc.push({ name, avatar: contributorsAvatars[name] });
  return acc;
}, [] as Contributor[]);

// const createLinks = (tm: CoreTeam): CoreTeam => {
//   tm.links = [
//     { icon: 'github', link: `https://github.com/${tm.github}` },
//     { icon: 'twitter', link: `https://twitter.com/${tm.twitter}` },
//   ];
//   return tm;
// };

// const plainTeamMembers: CoreTeam[] = [
//   {
//     avatar: contributorsAvatars.antfu,
//     name: 'Anthony Fu',
//     github: 'antfu',
//     twitter: 'antfu7',
//     sponsor: 'https://github.com/sponsors/antfu',
//     title: 'A fanatical open sourceror, working',
//     org: 'NuxtLabs',
//     desc: 'Core team member of Vite & Vue',
//   },
//   {
//     avatar: contributorsAvatars['sheremet-va'],
//     name: 'Vladimir',
//     github: 'sheremet-va',
//     twitter: 'sheremet_va',
//     sponsor: 'https://github.com/sponsors/sheremet-va',
//     title: 'An open source fullstack developer',
//     desc: 'Core team member of Vitest',
//   },
//   {
//     avatar: contributorsAvatars['patak-dev'],
//     name: 'Patak',
//     github: 'patak-dev',
//     twitter: 'patak_dev',
//     sponsor: 'https://github.com/sponsors/patak-dev',
//     title: 'A collaborative being, working',
//     org: 'StackBlitz',
//     desc: 'Core team member of Vite & Vue',
//   },
//   {
//     avatar: contributorsAvatars.Aslemammad,
//     name: 'Mohammad Bagher',
//     github: 'Aslemammad',
//     twitter: 'asleMammadam',
//     title: 'An open source developer',
//     desc: 'Team member of Poimandres & Vike',
//   },
//   {
//     avatar: contributorsAvatars.Demivan,
//     name: 'Ivan Demchuk',
//     github: 'Demivan',
//     twitter: 'IvanDemchuk',
//     title: 'A tech lead, fullstack developer',
//     desc: 'Author of fluent-vue',
//   },
//   {
//     avatar: contributorsAvatars.userquin,
//     name: 'Joaquín Sánchez',
//     github: 'userquin',
//     twitter: 'userquin',
//     title: 'A fullstack and android developer',
//     desc: "Vite's fanatical follower",
//   },
//   {
//     avatar: contributorsAvatars.zxch3n,
//     name: 'Zixuan Chen',
//     github: 'zxch3n',
//     twitter: 'zxch3n',
//     title: 'A fullstack developer',
//     desc: 'Creating tools for collaboration',
//   },
// ];

// const teamMembers = plainTeamMembers.map((tm) => createLinks(tm));

// export { teamMembers };
