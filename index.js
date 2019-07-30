const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const logger = require('@vue/cli-shared-utils')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtensionReloader = require('webpack-extension-reloader')
const ZipPlugin = require('zip-webpack-plugin')
const defaultOptions = {
  components: {},
  componentOptions: {},
  manifestSync: ['version'],
  modesToZip: ['production'],
  manifestTransformer: null
}
const performanceAssetFilterList = [
  (file) => !/\.map$/.test(file),
  (file) => !file.endsWith('.zip'),
  (file) => !/^icons\//.test(file)
]

function getManifestJsonString (pluginOptions, jsonContent) {
  if (pluginOptions.manifestTransformer) {
    const jsonContentCopy = Object.assign({}, jsonContent)
    jsonContent = pluginOptions.manifestTransformer(jsonContentCopy)
  }
  return JSON.stringify(jsonContent, null, 2)
}

module.exports = (api, options) => {
  const appRootPath = api.getCwd()
  const pluginOptions = options.pluginOptions.browserExtension
    ? Object.assign(defaultOptions, options.pluginOptions.browserExtension)
    : defaultOptions
  const componentOptions = pluginOptions.componentOptions
  const packageJson = require(path.join(appRootPath, 'package.json'))
  const isProduction = api.service.mode === 'production'
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = fs.existsSync(keyFile)

  api.chainWebpack((webpackConfig) => {
    webpackConfig.entryPoints.delete('app')
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
        entry[name] = paths.map((path) => api.resolve(path))
      }
    }
    webpackConfig.merge({ entry })
    webpackConfig.optimization.delete('splitChunks')
  })

  api.configureWebpack((webpackConfig) => {
    webpackConfig.output.filename = '[name].js'
    webpackConfig.output.chunkFilename = 'js/[id].[name].js'
    webpackConfig.node.global = false

    if (webpackConfig.performance === undefined) {
      webpackConfig.performance = {}
    }
    webpackConfig.performance.assetFilter = (assetFilename) =>
      performanceAssetFilterList.every((filter) => filter(assetFilename))

    if (pluginOptions.autoImportPolyfill) {
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          browser: 'webextension-polyfill'
        })
      )

      // Workaround for https://github.com/mozilla/webextension-polyfill/issues/68
      webpackConfig.module.rules.push({
        test: require.resolve('webextension-polyfill', { paths: [appRootPath] }),
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

    webpackConfig.plugins.push(
      new CopyWebpackPlugin([
        {
          from: './src/manifest.json',
          to: 'manifest.json',
          transform: async (content) => {
            const jsonContent = JSON.parse(content)
            if (pluginOptions.manifestSync.includes('version')) {
              jsonContent.version = packageJson.version
            }
            if (pluginOptions.manifestSync.includes('description')) {
              jsonContent.description = packageJson.description
            }

            if (isProduction) {
              return getManifestJsonString(pluginOptions, jsonContent)
            }

            jsonContent.content_security_policy =
              jsonContent.content_security_policy || "script-src 'self' 'unsafe-eval'; object-src 'self'"

            if (hasKeyFile) {
              try {
                jsonContent.key = await new Promise((resolve, reject) => {
                  exec(`openssl rsa -in ${keyFile} -pubout -outform DER | openssl base64 -A`, (error, stdout) => {
                    if (error) {
                      // node couldn't execute the command
                      return reject(error)
                    }
                    resolve(stdout)
                  })
                })
              } catch (error) {
                logger.error('Unexpected error hashing keyfile:', error)
              }
            }
            if (!jsonContent.key) {
              logger.warn(
                'No key.pem file found. This is fine for dev, however you may have problems publishing without one'
              )
            }

            return getManifestJsonString(pluginOptions, jsonContent)
          }
        }
      ])
    )

    if (pluginOptions.modesToZip.includes(api.service.mode)) {
      webpackConfig.plugins.push(
        new ZipPlugin({
          path: api.resolve(`${options.outputDir || 'dist'}-zip`),
          filename: `${packageJson.name}-v${packageJson.version}-${api.service.mode}.zip`
        })
      )
    }

    // configure webpack-extension-reloader for automatic reloading of extension when content and background scripts change (not HMR)
    // enabled only when webpack mode === 'development'
    const entries = {}

    if (pluginOptions.components.background) {
      entries.background = 'background'
    }

    if (pluginOptions.components.contentScripts) {
      entries.contentScript = Object.keys(componentOptions.contentScripts.entries)
    }
    if (!isProduction) {
      webpackConfig.plugins.push(new ExtensionReloader({ entries }))
    }
  })
}
