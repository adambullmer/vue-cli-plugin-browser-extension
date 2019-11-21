const logger = require('@vue/cli-shared-utils')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtensionReloader = require('webpack-extension-reloader')
const ZipPlugin = require('zip-webpack-plugin')
const { keyExists } = require('./lib/signing-key')
const manifestTransformer = require('./lib/manifest')
const defaultOptions = {
  components: {},
  componentOptions: {},
  extensionReloaderOptions: {},
  manifestSync: ['version'],
  modesToZip: ['production'],
  manifestTransformer: null
}
const performanceAssetFilterList = [
  (file) => !/\.map$/.test(file),
  (file) => !file.endsWith('.zip'),
  (file) => !/^icons\//.test(file)
]

module.exports = (api, options) => {
  const appRootPath = api.getCwd()
  const pluginOptions = options.pluginOptions.browserExtension
    ? Object.assign(defaultOptions, options.pluginOptions.browserExtension)
    : defaultOptions
  const componentOptions = pluginOptions.componentOptions
  const extensionReloaderOptions = pluginOptions.extensionReloaderOptions
  const packageJson = require(api.resolve('package.json'))
  const isProduction = api.service.mode === 'production'
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = keyExists(keyFile)
  const contentScriptEntries = Object.keys((componentOptions.contentScripts || {}).entries || {})

  const entry = {}
  const entries = {}
  if (componentOptions.background) {
    entries.background = 'background'
    entry.background = [api.resolve(componentOptions.background.entry)]
  }
  if (componentOptions.contentScripts) {
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
    // Ignore rewriting names for background and content scripts
    webpackConfig.output.filename((file) =>
      isProduction && options.filenameHashing && !userScripts.includes(file.chunk.name) ? 'js/[name].[contenthash:8].js' : 'js/[name].js'
    )
    webpackConfig.merge({ entry })

    webpackConfig.plugin('copy-manifest').use(CopyWebpackPlugin, [
      [
        {
          from: './src/manifest.json',
          to: 'manifest.json',
          transform: manifestTransformer(api, pluginOptions, packageJson)
        }
      ]
    ])

    webpackConfig.plugin('provide-webextension-polyfill').use(webpack.ProvidePlugin, [
      {
        browser: 'webextension-polyfill'
      }
    ])

    // Workaround for https://github.com/mozilla/webextension-polyfill/issues/68
    webpackConfig.module
      .rule('provide-webextension-polyfill')
      .test(require.resolve('webextension-polyfill', { paths: [appRootPath] }))
      .use('imports')
      .loader('imports-loader')
      .options({ browser: '>undefined' })

    if (isProduction) {
      // Silence warnings of known large files, like images, sourcemaps, and the zip artifact
      webpackConfig.performance.assetFilter((assetFilename) =>
        performanceAssetFilterList.every((filter) => filter(assetFilename))
      )

      if (hasKeyFile) {
        webpackConfig.plugin('copy-signing-key').use(CopyWebpackPlugin, [[{ from: keyFile, to: 'key.pem' }]])
      } else {
        logger.warn('No `key.pem` file detected. This is problematic only if you are publishing an existing extension')
      }
    }

    if (pluginOptions.modesToZip.includes(api.service.mode)) {
      webpackConfig.plugin('zip-browser-extension').use(ZipPlugin, [
        {
          path: api.resolve(pluginOptions.artifactsDir || 'artifacts'),
          filename: `${packageJson.name}-v${packageJson.version}-${api.service.mode}.zip`
        }
      ])
    }

    // configure webpack-extension-reloader for automatic reloading of extension when content and background scripts change (not HMR)
    // enabled only when webpack mode === 'development'
    if (!isProduction) {
      webpackConfig.plugin('extension-reloader').use(ExtensionReloader, [{ entries, ...extensionReloaderOptions }])
    }

    webpackConfig.plugin('copy').tap((args) => {
      args[0][0].ignore.push('browser-extension.html')
      return args
    })
  })

  api.configureWebpack((webpackConfig) => {
    const omitUserScripts = ({ name }) => !userScripts.includes(name)
    if (webpackConfig.optimization && webpackConfig.optimization.splitChunks && webpackConfig.optimization.splitChunks.cacheGroups) {
      if (webpackConfig.optimization.splitChunks.cacheGroups.vendors) {
        webpackConfig.optimization.splitChunks.cacheGroups.vendors.chunks = omitUserScripts
      }
      if (webpackConfig.optimization.splitChunks.cacheGroups.common) {
        webpackConfig.optimization.splitChunks.cacheGroups.common.chunks = omitUserScripts
      }
    }
  })
}
