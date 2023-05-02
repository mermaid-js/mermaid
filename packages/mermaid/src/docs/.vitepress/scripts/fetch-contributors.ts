// Adapted from https://github.dev/vitest-dev/vitest/blob/991ff33ab717caee85ef6cbe1c16dc514186b4cc/scripts/update-contributors.ts#L6

import { writeFile } from 'node:fs/promises';

const pathContributors = new URL('../contributor-names.json', import.meta.url);

interface Contributor {
  login: string;
}

async function fetchContributors() {
  const collaborators: string[] = [];
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
    page++;
  } while (data.length === 100);
  return collaborators.filter((name) => !name.includes('[bot]'));
}

async function generate() {
  const collaborators = await fetchContributors();
  await writeFile(pathContributors, JSON.stringify(collaborators, null, 2) + '\n', 'utf8');
}

void generate();
