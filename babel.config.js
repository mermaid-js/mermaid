module.exports = {
  comments: false,
  minified: true,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'defaults, ie >= 11, current node',
      },
    ],
  ],
};
