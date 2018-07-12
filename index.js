const path = require('path')
const { log } = require('@vue/cli-shared-utils')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')
const WebpackShellPlugin = require('webpack-shell-plugin-next')
const { version } = require('./package.json')

module.exports = (api) => {
  api.configureWebpack(webpackConfig => {
    delete webpackConfig.entry.app
    webpackConfig.entry.background = './src/background.js'
    webpackConfig.entry['popup/popup'] = './src/popup/popup.js'

    webpackConfig.plugins.push(new CopyWebpackPlugin([
      { from: './src/icons', to: 'icons', ignore: ['icon.xcf'] },
      { from: './src/popup/popup.html', to: 'popup/popup.html' },
      {
        from: './src/manifest.json',
        to: 'manifest.json',
        transform: (content) => {
          const jsonContent = JSON.parse(content)
          jsonContent.version = version

          if (process.env.NODE_ENV === 'development') {
            jsonContent['content_security_policy'] = "script-src 'self' 'unsafe-eval'; object-src 'self'"
          }

          return JSON.stringify(jsonContent, null, 2)
        }
      }
    ]))

    const scriptPath = path.join(__dirname, 'scripts/remove-evals.js')
    webpackConfig.plugins.push(new WebpackShellPlugin({
      onBuildExit: {
        scripts: [`node ${scriptPath}`],
        blocking: true,
        parallel: false
      }
    }))

    if (process.env.HMR === 'true') {
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new ChromeExtensionReloader()
      ])
    }
  })

  api.registerCommand('ext-serve', {
    description: 'Builds and watches the project, writing the files to the output directory'
  }, (...args) => {
    log('Starting webpack in watch mode...')

    api.configureWebpack((webpackConfig) => {
      webpackConfig.watch = true
    })

    api.service.run('build', ...args)
  })
}
