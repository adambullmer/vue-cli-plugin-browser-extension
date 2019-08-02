const path = require('path')
const logger = require('@vue/cli-shared-utils')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtensionReloader = require('webpack-extension-reloader')
const ZipPlugin = require('zip-webpack-plugin')
const { keyExists, hashKey } = require('./lib/signing-key')
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
  const hasKeyFile = keyExists(keyFile)
  const contentScriptEntries = Object.keys((componentOptions.contentScripts || {}).entries || {})

  const entry = {}
  const entries = {}
  if (pluginOptions.components.background) {
    entries.background = 'background'
    entry.background = [api.resolve(componentOptions.background.entry)]
  }
  if (pluginOptions.components.contentScripts) {
    entries.contentScript = contentScriptEntries
    for (const name of contentScriptEntries) {
      let paths = componentOptions.contentScripts.entries[name]
      if (!Array.isArray(paths)) {
        paths = [paths]
      }

      entry[name] = paths.map((path) => api.resolve(path))
    }
  }
  const userScripts = Object.keys(entry)

  api.chainWebpack((webpackConfig) => {
    webpackConfig.entryPoints.delete('app')
    // Ignore rewriting names for background and content scripts
    webpackConfig.output.filename((file) =>
      userScripts.includes(file.chunk.name) || !isProduction ? 'js/[name].js' : 'js/[name].[contenthash:8].js'
    )
    webpackConfig.merge({ entry })
    webpackConfig.optimization.delete('splitChunks')

    // configure webpack-extension-reloader for automatic reloading of extension when content and background scripts change (not HMR)
    // enabled only when webpack mode === 'development'
    if (!isProduction) {
      webpackConfig.plugin('extension-reloader').use(ExtensionReloader, [{ entries }])
    }
  })

  api.configureWebpack((webpackConfig) => {
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
                jsonContent.key = await hashKey(keyFile)
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
  })
}
