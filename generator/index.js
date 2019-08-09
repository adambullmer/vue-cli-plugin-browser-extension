const path = require('path')
const { generateKey } = require('../lib/signing-key')
const { renderDomain, renderGitignore, renderTs } = require('../lib/render')

module.exports = (api, _options) => {
  const browserExtension = Object.assign({}, _options)
  delete browserExtension.registry
  delete browserExtension.components
  // const hasRouter = api.hasPlugin('router')
  // const hasVuex = api.hasPlugin('vuex')
  const hasTs = api.hasPlugin('typescript')
  const hasLint = api.hasPlugin('eslint')
  const fileExt = hasTs ? 'ts' : 'js'

  browserExtension.componentOptions = {}
  if (browserExtension.components.background) {
    browserExtension.componentOptions.background = {
      entry: `src/background.${fileExt}`
    }
  }
  if (browserExtension.components.contentScripts) {
    browserExtension.componentOptions.contentScripts = {
      entries: {
        'content-script': [`src/content-scripts/content-script.${fileExt}`]
      }
    }
  }

  const pkg = {
    private: true,
    scripts: {
      serve: 'vue-cli-service build --mode development --watch'
    },
    devDependencies: {},
    vue: {
      pages: {},
      pluginOptions: { browserExtension }
    }
  }
  if (hasLint) {
    pkg.eslintConfig = { env: { webextensions: true } }
  }
  if (hasTs) {
    pkg.devDependencies['@types/firefox-webext-browser'] = '^67.0.2'
  }
  api.extendPackage(pkg)

  const { name, description } = require(api.resolve('package.json'))
  const options = Object.assign({}, browserExtension)
  options.name = name
  options.description = description
  // options.hasRouter = hasRouter
  // options.hasVuex = hasVuex
  options.hasTs = hasTs
  options.hasLint = hasLint
  options.fileExt = fileExt

  api.render('./template/base-app', options)
  api.render({ './src/components/HelloWorld.vue': `./template/HelloWorld.${fileExt}.vue` }, options)

  if (options.components.background) {
    api.render(
      {
        [`./src/background.${fileExt}`]: `./template/background/src/background.js`
      },
      options
    )
  }

  if (options.components.contentScripts) {
    api.render(
      {
        [`./src/content-scripts/content-script.${fileExt}`]: `./template/content-scripts/src/content-scripts/content-script.js`
      },
      options
    )
  }

  if (options.components.popup) {
    renderDomain({ title: 'Popup', ext: fileExt, options, api })
  }

  if (options.components.options) {
    renderDomain({ title: 'Options', ext: fileExt, options, api })
  }

  if (options.components.override) {
    renderDomain({ title: 'Override', ext: fileExt, options, api })
  }

  if (options.components.standalone) {
    renderDomain({ title: 'Standalone', filename: 'index.html', ext: fileExt, options, api })
  }

  if (options.components.devtools) {
    renderDomain({ title: 'Devtools', ext: fileExt, options, api })
  }

  if (options.generateSigningKey === true) {
    api.render((files) => {
      files['key.pem'] = generateKey()
    })
  }

  api.onCreateComplete(() => {
    renderGitignore(api)

    if (hasTs) {
      renderTs(api)
    }
  })
}
