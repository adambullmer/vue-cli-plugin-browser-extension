const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const logger = require('@vue/cli-shared-utils')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const defaultOptions = { components: {}, componentOptions: {} }

module.exports = (api, options) => {
  const appRootPath = api.getCwd()
  const pluginOptions = options.pluginOptions.browserExtension ? options.pluginOptions.browserExtension : defaultOptions
  const componentOptions = pluginOptions.componentOptions
  const { name, version } = require(path.join(appRootPath, 'package.json'))
  const isDevelopment = api.service.mode === 'development'
  const isProduction = api.service.mode === 'production'
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = fs.existsSync(keyFile)

  api.chainWebpack((webpackConfig) => {
    const config = webpackConfig.entryPoints.delete('app').end()
    const entry = {}
    if (pluginOptions.components.background) {
      entry['background'] = [api.resolve(componentOptions.background.entry)]
    }
    if (pluginOptions.components.contentScripts) {
      const entries = componentOptions.contentScripts.entries
      for (const name of Object.keys(entries)) {
        let paths = entries[name]
        if (!Array.isArray(paths)) {
          paths = [paths]
        }
        entry[name] = paths.map(path => api.resolve(path))
      }
    }
    config.merge({entry})
  })

  api.configureWebpack((webpackConfig) => {
    webpackConfig.output.filename = '[name].js'
    webpackConfig.output.chunkFilename = 'js/[id].[name].js?[hash:8]'
    webpackConfig.node.global = false

    if (pluginOptions.autoImportPolyfill) {
      webpackConfig.plugins.push(new webpack.ProvidePlugin({
        'browser': 'webextension-polyfill'
      }))

      // Workaround for https://github.com/mozilla/webextension-polyfill/issues/68
      webpackConfig.module.rules.push({
        test: require.resolve('webextension-polyfill', {paths: [appRootPath]}),
        use: 'imports-loader?browser=>undefined'
      })
    }

    if (isProduction) {
      if (hasKeyFile) {
        webpackConfig.plugins.push(new CopyWebpackPlugin([{ from: keyFile, to: 'key.pem' }]))
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
              fs.statSync(keyFile)

              return exec(`openssl rsa -in ${keyFile} -pubout -outform DER | openssl base64 -A`, (error, stdout) => {
                if (error) {
                  // node couldn't execute the command
                  reject(error)
                }

                jsonContent.key = stdout
                resolve(JSON.stringify(jsonContent, null, 2))
              })
            } catch (error) {
              logger.warn('No key.pem file found. This is fine for dev, however you may have problems publishing without one')
              resolve(JSON.stringify(jsonContent, null, 2))
            }
          })
        }
      }
    ]))

    if (isProduction) {
      webpackConfig.plugins.push(new ZipPlugin({
        path: api.resolve(`${options.outputDir || 'dist'}-zip`),
        filename: `${name}-v${version}.zip`
      }))
    }

    if (options.api === 'chrome' && isDevelopment) {
      const entries = {}

      if (pluginOptions.components.background) {
        entries.background = 'background'
      }

      if (pluginOptions.components.contentScripts) {
        entries.contentScript = Object.keys(componentOptions.contentScripts.entries)
      }
      const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')
      webpackConfig.plugins.push(new ChromeExtensionReloader({ entries }))
    }
  })
}
