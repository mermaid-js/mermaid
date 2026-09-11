import { beforeEach, describe, expect, it, vi } from 'vitest';
import { knut, plainTeamMembers } from './teamMembers.js';

const usernames = vi.hoisted(() => [] as string[]);
vi.mock('./contributor-names.json', () => ({ default: usernames }));

describe('team contributors', () => {
  beforeEach(() => {
    vi.resetModules();
    usernames.length = 0;
  });

  it('puts missing contributors last while keeping the creator first', async () => {
    usernames.push(plainTeamMembers[1].github, plainTeamMembers[0].github);
    const { teamMembers } = await import('./contributors.js');
    expect(teamMembers.map((member) => member.github)).toEqual([
      knut.github,
      ...usernames,
      ...plainTeamMembers.slice(2).map((member) => member.github),
    ]);
  });

  it('uses the renamed GitHub account for Nacho', async () => {
    const username = 'thisisnacho';
    usernames.push(username);
    const { teamMembers } = await import('./contributors.js');
    const nacho = teamMembers.find((member) => member.name === 'Nacho Orlandoni');
    expect(nacho?.github).toBe(username);
    expect(nacho?.avatar).toBe(`/user-avatars/${username}.png`);
    expect(nacho?.links).toContainEqual({ icon: 'github', link: `https://github.com/${username}` });
    expect(teamMembers[1]).toBe(nacho);
  });

  it('preserves team order when the contributor list is empty', async () => {
    const { teamMembers } = await import('./contributors.js');
    expect(teamMembers.map((member) => member.github)).toEqual([
      knut.github,
      ...plainTeamMembers.map((member) => member.github),
    ]);
  });
});
