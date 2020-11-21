module.exports = {
  root: true,
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  globals: {
    ClientAddonApi: false,
    mapSharedData: false,
    Vue: false,
    name: 'off'
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    babelOptions: {
      cwd: require('path').resolve(__dirname)
    }
  }
}
