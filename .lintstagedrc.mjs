export default {
  '!(docs/**/*)*.{ts,js,html,md,mts}': [
    'biome check --no-errors-on-unmatched --files-ignore-unknown=true --write',
  ],
  '.cspell/*.txt': ['tsx scripts/fixCSpell.ts'],
  '**/*.jison': ['pnpm -w run lint:jison'],
};
