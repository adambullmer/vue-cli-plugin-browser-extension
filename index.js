const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const logger = require('@vue/cli-shared-utils')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')
const WebpackShellPlugin = require('webpack-shell-plugin-next')
const ZipPlugin = require('zip-webpack-plugin')

module.exports = (api) => {
  const appRootPath = api.getCwd()
  const { name, version } = require(path.join(appRootPath, 'package.json'))
  const isDevelopment = api.service.mode === 'development'
  const isProduction = api.service.mode === 'production'
  const outputDir = api.resolve(api.service.projectOptions.outputDir || 'dist')
  const packageScript = isProduction ? null : 'remove-evals.js'
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = fs.existsSync(keyFile)
  const backgroundFile = api.resolve('src/background.js')
  const contentScriptFile = api.resolve('src/content-script.js')
  const hasBackgroundFile = fs.existsSync(backgroundFile)
  const hasContentScriptFile = fs.existsSync(contentScriptFile)

  api.chainWebpack((webpackConfig) => {
    webpackConfig.entryPoints.delete('app').end()
      .when(hasBackgroundFile, (config) => {
        config.entry('background')
          .add(backgroundFile)
          .end()
      })
      .when(hasContentScriptFile, (config) => {
        config.entry('content-script')
          .add(contentScriptFile)
          .end()
      })
  })

  api.configureWebpack((webpackConfig) => {
    webpackConfig.output.filename = '[name].js'
    webpackConfig.output.chunkFilename = 'js/[id].[name].js?[hash:8]'

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
      const entries = {}
      if (hasBackgroundFile) {
        entries.background = 'background'
      }
      if (hasContentScriptFile) {
        entries.contentScript = 'content-script'
      }

      webpackConfig.plugins.push(new ChromeExtensionReloader({ entries }))
    }
  })
}
