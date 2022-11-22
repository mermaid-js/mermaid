export default {
  '!(docs/**/*)*.{ts,js,json,html,md,mts}': ['eslint --fix', 'prettier --write'],
  'cSpell.json': ['ts-node-esm scripts/fixCSpell.ts'],
  '**/*.jison': ['pnpm -w run lint:jison'],
};
