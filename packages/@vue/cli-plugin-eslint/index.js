const path = require('path')
const eslintWebpackPlugin = require('eslint-webpack-plugin')

/** @type {import('@vue/cli-service').ServicePlugin} */
module.exports = (api, options) => {
  if (options.lintOnSave) {
    const extensions = require('./eslintOptions').extensions(api)
    // Use loadModule to allow users to customize their ESLint dependency version.
    const { resolveModule, loadModule } = require('@vue/cli-shared-utils')
    const cwd = api.getCwd()

    api.chainWebpack(webpackConfig => {
      const { lintOnSave } = options
      const allWarnings = lintOnSave === true || lintOnSave === 'warning'
      const allErrors = lintOnSave === 'error'

      webpackConfig.plugin('eslint').use(eslintWebpackPlugin, [
        {
          extensions,
          emitWarning: allWarnings,
          // only emit errors in production mode.
          emitError: allErrors,
          eslintPath: path.dirname(
            resolveModule('eslint/package.json', cwd) ||
            resolveModule('eslint/package.json', __dirname)
          ),
          formatter: loadModule('eslint/lib/formatters/codeframe', cwd, true)
        }
      ])
    })
  }

  api.registerCommand(
    'lint',
    {
      description: 'lint and fix source files',
      usage: 'vue-cli-service lint [options] [...files]',
      options: {
        '--format [formatter]': 'specify formatter (default: codeframe)',
        '--no-fix': 'do not fix errors or warnings',
        '--no-fix-warnings': 'fix errors, but do not fix warnings',
        '--max-errors [limit]':
          'specify number of errors to make build failed (default: 0)',
        '--max-warnings [limit]':
          'specify number of warnings to make build failed (default: Infinity)',
        '--output-file [file_path]':
          'specify file to write report to'
      },
      details:
        'For more options, see https://eslint.org/docs/user-guide/command-line-interface#options'
    },
    args => {
      require('./lint')(args, api)
    }
  )
}
