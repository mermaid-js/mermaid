let jisonPlugin = {
  name: 'jison',
  setup(build) {
    const { Generator } = require('jison');
    let fs = require('fs');

    build.onLoad({ filter: /\.jison$/ }, async (args) => {
      // Load the file from the file system
      let source = await fs.promises.readFile(args.path, 'utf8');

      try {
        let contents = new Generator(source, {}).generate();
        return { contents, warnings: [] };
      } catch (e) {
        return { errors: [] };
      }
    });
  },
};

const { build } = require('esbuild');
build({
  bundle: true,
  minify: false,
  keepNames: true,
  globalName: 'mermaid',
  platform: 'browser',
  entryPoints: ['src/mermaid.js'],
  outfile: 'dist/mermaid.js',
  plugins: [jisonPlugin],
}).catch(() => process.exit(1));
