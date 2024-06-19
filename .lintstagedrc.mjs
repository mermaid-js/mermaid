export default {
  '!(docs/**/*)*.{ts,js,html,md,mts}': [
    'eslint --cache --cache-strategy content --fix',
    // don't cache prettier yet, since we use `prettier-plugin-jsdoc`,
    // and prettier doesn't invalidate cache on plugin updates"
    // https://prettier.io/docs/en/cli.html#--cache
    'prettier --write',
  ],
  '.cspell/*.txt': ['tsx scripts/fixCSpell.ts'],
  '**/*.jison': ['pnpm -w run lint:jison'],
};
