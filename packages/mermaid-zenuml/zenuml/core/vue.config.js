const { execSync } = require('child_process');
process.env.VUE_APP_GIT_HASH = execSync('git rev-parse --short HEAD').toString().trim();
process.env.VUE_APP_GIT_BRANCH = execSync('git branch --show-current').toString().trim();

module.exports = {
  pages: getPages(),
  chainWebpack: (config) => {
    // A workaround that allows npm link or yarn link
    // https://cli.vuejs.org/guide/troubleshooting.html#symbolic-links-in-node-modules
    config.resolve.symlinks(false);

    config.plugin('define').tap((definitions) => {
      definitions[0]['VERSION'] = JSON.stringify(require('./package.json').version);
      definitions[0]['BUILD_TIME'] = JSON.stringify(new Date());
      return definitions;
    });

    // We need to clear the pre-built svg rule
    // use `vue-cli-service inspect to check the webpack
    // the built-in webpack uses file-loader
    const svgRule = config.module.rule('svg');
    svgRule.store.clear();
    svgRule
      .test(/\.svg$/)
      .type('asset/inline')
      .end();
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
      },
    },
  },
  devServer: {
    allowedHosts: 'all',
    historyApiFallback: true,
    hot: true,
    host: '0.0.0.0',
    port: 8080,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
  },
};

function getPageObject(file) {
  // remove first level of directory, keep the rest
  const subFilePath = file.split('/').slice(1).join('/');
  return {
    [subFilePath]: {
      entry: 'src/main.ts',
      template: file,
      filename: subFilePath,
    },
  };
}

// https://cli.vuejs.org/config/#pages
function getPages() {
  // get all html files in public folder recursively
  const files = execSync('find public -name "*.html"').toString().trim().split('\n');

  function skipEmbedContainerDemo(file) {
    return file !== 'embed-container-demo.html';
  }

  const pages = files.filter(skipEmbedContainerDemo).map(getPageObject);
  // merge items in pages array into one object
  return Object.assign({}, ...pages);
}
