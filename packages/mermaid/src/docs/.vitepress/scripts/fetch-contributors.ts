// Adapted from https://github.dev/vitest-dev/vitest/blob/991ff33ab717caee85ef6cbe1c16dc514186b4cc/scripts/update-contributors.ts#L6

import { writeFile } from 'node:fs/promises';
import { knut, plainTeamMembers } from '../data.js';
import { existsSync } from 'node:fs';

const pathContributors = new URL('../contributor-names.json', import.meta.url);

interface Contributor {
  login: string;
}

async function fetchContributors() {
  const collaborators: string[] = [];
  try {
    let page = 1;
    let data: Contributor[] = [];
    do {
      const response = await fetch(
        `https://api.github.com/repos/mermaid-js/mermaid/contributors?per_page=100&page=${page}`,
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
          },
        }
      );
      data = await response.json();
      collaborators.push(...data.map((i) => i.login));
      console.log(`Fetched page ${page}`);
      page++;
    } while (data.length === 100);
  } catch (e) {
    /* contributors fetching failure must not hinder docs development */
  }
  return collaborators.filter((name) => !name.includes('[bot]'));
}

async function generate() {
  if (existsSync(pathContributors)) {
    // Only fetch contributors once, when running locally.
    // In CI, the file won't exist, so it'll fetch every time as expected.
    return;
  }
  // Will fetch all contributors only in CI to speed up local development.
  const collaborators = process.env.CI
    ? await fetchContributors()
    : [knut, ...plainTeamMembers].map((m) => m.github);
  await writeFile(pathContributors, JSON.stringify(collaborators, null, 2) + '\n', 'utf8');
}

void generate();
