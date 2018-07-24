const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const logger = require('@vue/cli-shared-utils')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')
const WebpackShellPlugin = require('webpack-shell-plugin-next')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')

const appRootPath = process.cwd()

module.exports = (api) => {
  const { name, version } = require(path.join(appRootPath, 'package.json'))
  const isDevelopment = api.service.mode === 'development'
  const isProduction = api.service.mode === 'production'
  const outputDir = api.resolve(api.service.projectOptions.outputDir || 'dist')
  const packageScript = isProduction ? null : 'remove-evals.js'
  const hasOptionsPageEntry = fs.existsSync(api.resolve('./src/options/options.js'))
  const hasKeyFile = fs.existsSync(api.resolve('key.pem'))

  api.configureWebpack((webpackConfig) => {
    webpackConfig.output.filename = '[name].js'
    webpackConfig.output.chunkFilename = 'js/[id].[name].js?[hash:8]'

    delete webpackConfig.entry.app
    webpackConfig.entry.background = './src/background.js'
    webpackConfig.entry['popup/popup'] = './src/popup/popup.js'

    if (hasOptionsPageEntry) {
      webpackConfig.entry['options/options'] = './src/options/options.js'
    }

    if (isProduction) {
      if (hasKeyFile) {
        webpackConfig.plugins.push(new CopyWebpackPlugin([{ from: './key.pem', to: 'key.pem' }]))
      } else {
        logger.warn('No `key.pem` file detected. This is problematic only if you are publishing an existing extension')
      }
    }

    webpackConfig.plugins.push(new CopyWebpackPlugin([
      { from: './src/icons', to: 'icons/[name].[ext]', ignore: ['icon.xcf'] },
      {
        from: './src/manifest.json',
        to: 'manifest.json',
        transform: (content) => {
          return new Promise((resolve, reject) => {
            const jsonContent = JSON.parse(content)
            jsonContent.version = version

            if (isProduction) {
              return resolve(JSON.stringify(jsonContent, null, 2))
            }

            jsonContent.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self'"

            try {
              const keyfile = path.join(appRootPath, 'key.pem')
              fs.statSync(keyfile)

              return exec(`openssl rsa -in ${keyfile} -pubout -outform DER | openssl base64 -A`, (error, stdout) => {
                if (error) {
                  // node couldn't execute the command
                  reject(error)
                }

                jsonContent.key = stdout
                resolve(JSON.stringify(jsonContent, null, 2))
              })
            } catch (error) {
              if (isProduction) {
                logger.error('no key.pem file found. You cannot publish to the chrome store without one. If this is your first publish, chrome will make a key for you, and you can ignore this message')
              } else {
                logger.warn('No key.pem file found. This is fine for dev, however you may have problems publishing without one')
              }
            }
          })
        }
      }
    ]))

    webpackConfig.plugins.push(new HtmlWebpackPlugin({
      title: name,
      hash: true,
      cache: true,
      inject: 'body',
      filename: './popup/popup.html',
      template: './src/popup/popup.html',
      appMountId: 'app',
      chunks: ['popup/popup', 'chunk-vendors']
    }))

    if (hasOptionsPageEntry) {
      webpackConfig.plugins.push(new HtmlWebpackPlugin({
        title: name,
        hash: true,
        cache: true,
        inject: 'body',
        filename: './options/options.html',
        template: './src/options/options.html',
        appMountId: 'app',
        chunks: ['options/options', 'chunk-vendors']
      }))
    }

    if (packageScript === null) {
      webpackConfig.plugins.push(new ZipPlugin({
        path: api.resolve(`${api.service.projectOptions.outputDir || 'dist'}-zip`),
        filename: `${name}-v${version}.zip`
      }))
    } else {
      webpackConfig.plugins.push(new WebpackShellPlugin({
        onBuildExit: {
          scripts: [`node ${path.join(__dirname, 'scripts', packageScript)} ${outputDir}`],
          blocking: true,
          parallel: false
        }
      }))
    }

    if (isDevelopment) {
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new ChromeExtensionReloader({
          entries: {
            background: 'background'
          }
        })
      ])
    }
  })
}
