const config = require('./vue.config');
describe('vue.config.js', function () {
  it('should get pages', () => {
    const expectedPages = {
      'cy/smoke-creation.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke-creation.html',
        template: 'public/cy/smoke-creation.html',
      },
      'cy/smoke-fragment-issue.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke-fragment-issue.html',
        template: 'public/cy/smoke-fragment-issue.html',
      },
      'cy/smoke-fragment.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke-fragment.html',
        template: 'public/cy/smoke-fragment.html',
      },
      'cy/smoke-interaction.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke-interaction.html',
        template: 'public/cy/smoke-interaction.html',
      },
      'cy/smoke-return.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke-return.html',
        template: 'public/cy/smoke-return.html',
      },
      'cy/smoke.html': {
        entry: 'src/main.ts',
        filename: 'cy/smoke.html',
        template: 'public/cy/smoke.html',
      },
      'embed-container-demo.html': {
        entry: 'src/main.ts',
        filename: 'embed-container-demo.html',
        template: 'public/embed-container-demo.html',
      },
      'embed.html': {
        entry: 'src/main.ts',
        filename: 'embed.html',
        template: 'public/embed.html',
      },
      'index.html': {
        entry: 'src/main.ts',
        filename: 'index.html',
        template: 'public/index.html',
      },
    };
    expect(config.pages).toEqual(expectedPages);
  });
});
