import contributorUsernamesJson from './contributor-names.json';
import { CoreTeam, knut, plainTeamMembers } from './teamMembers.js';

const contributorUsernames: string[] = contributorUsernamesJson;

export const contributors = contributorUsernames.map((username) => {
  return { username, avatar: `/user-avatars/${username}.png` };
});

const websiteSVG = {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-globe"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
};

const createLinks = (tm: CoreTeam): CoreTeam => {
  tm.avatar = `/user-avatars/${tm.github}.png`;
  tm.title = tm.title ?? 'Developer';
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

const teamMembers = plainTeamMembers.map((tm) => createLinks(tm));
teamMembers.sort(
  (a, b) => contributorUsernames.indexOf(a.github) - contributorUsernames.indexOf(b.github)
);
teamMembers.unshift(createLinks(knut));

export { teamMembers };
