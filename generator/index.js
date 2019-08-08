const fs = require('fs')
const path = require('path')
const { generateKey } = require('../lib/signing-key')
const gitignoreRules = ['# Vue Browser Extension Output', '*.pem', '*.pub', '*.zip', '/artifacts']

function regexEscape (rule) {
  return rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = (api, _options) => {
  const options = Object.assign({}, _options)
  const hasRouter = api.hasPlugin('router')
  const hasVuex = api.hasPlugin('vuex')
  const hasTs = api.hasPlugin('typescript')
  const hasLint = api.hasPlugin('eslint')
  const fileExt = hasTs ? 'ts' : 'js'

  options.hasRouter = hasRouter
  options.hasVuex = hasVuex
  options.hasTs = hasTs
  options.hasLint = hasLint
  options.fileExt = fileExt
  options.componentOptions = {}
  if (options.components.background) {
    options.componentOptions.background = {
      entry: `src/background.${fileExt}`
    }
  }
  if (options.components.contentScripts) {
    options.componentOptions.contentScripts = {
      entries: {
        'content-script': [`src/content-scripts/content-script.${fileExt}`]
      }
    }
  }

  const appRootPath = process.cwd()
  const { name, description } = require(path.join(appRootPath, 'package.json'))
  const eslintConfig = { env: { webextensions: true } }
  const pkg = {
    private: true,
    scripts: {
      serve: 'vue-cli-service build --mode development --watch'
    },
    dependencies: {},
    devDependencies: {},
    vue: {
      pages: {},
      pluginOptions: {
        browserExtension: options
      }
    }
  }

  if (api.hasPlugin('eslint')) {
    pkg.eslintConfig = eslintConfig
  }

  if (hasTs) {
    pkg.devDependencies['@types/firefox-webext-browser'] = '^67.0.2'
  }

  api.extendPackage(pkg)
  api.render('./template/base-app', { name, description, ...options })
  api.render({ './src/components/HelloWorld.vue': `./template/HelloWorld.${fileExt}.vue` }, { name, ...options })

  if (options.components.background) {
    api.render(
      {
        [`./src/background.${fileExt}`]: `./template/background/src/background.${fileExt}`
      },
      { name, ...options }
    )
  }

  if (options.components.contentScripts) {
    api.render(
      {
        [`./src/content-scripts/content-script.${fileExt}`]: `./template/content-scripts/src/content-scripts/content-script.${fileExt}`
      },
      { name, ...options }
    )
  }

  if (options.components.popup) {
    api.render(
      {
        './src/popup/App.vue': `./template/popup/src/popup/App.${fileExt}.vue`,
        [`./src/popup/main.${fileExt}`]: `./template/popup/src/popup/main.${fileExt}`
      },
      { name, ...options }
    )

    pkg.vue.pages['popup'] = {
      entry: `src/popup/main.${fileExt}`,
      template: 'public/browser-extension.html',
      title: 'Popup'
    }
  }

  if (options.components.options) {
    api.render(
      {
        './src/options/App.vue': `./template/options/src/options/App.${fileExt}.vue`,
        [`./src/options/main.${fileExt}`]: `./template/options/src/options/main.${fileExt}`
      },
      { name, ...options }
    )

    pkg.vue.pages['options'] = {
      entry: `src/options/main.${fileExt}`,
      template: 'public/browser-extension.html',
      title: 'Options'
    }
  }

  if (options.components.override) {
    api.render(
      {
        './src/override/App.vue': `./template/override/src/override/App.${fileExt}.vue`,
        [`./src/override/main.${fileExt}`]: `./template/override/src/override/main.${fileExt}`
      },
      { name, ...options }
    )

    pkg.vue.pages['override'] = {
      entry: `src/override/main.${fileExt}`,
      template: 'public/browser-extension.html',
      title: 'Override'
    }
  }

  if (options.components.standalone) {
    api.render(
      {
        './src/standalone/App.vue': `./template/standalone/src/standalone/App.${fileExt}.vue`,
        [`./src/standalone/main.${fileExt}`]: `./template/standalone/src/standalone/main.${fileExt}`
      },
      { name, ...options }
    )

    pkg.vue.pages['standalone'] = {
      entry: `src/standalone/main.${fileExt}`,
      template: 'public/browser-extension.html',
      filename: 'index.html',
      title: name
    }
  }

  if (options.components.devtools) {
    api.render(
      {
        './src/devtools/App.vue': `./template/devtools/src/devtools/App.${fileExt}.vue`,
        [`./src/devtools/main.${fileExt}`]: `./template/devtools/src/devtools/main.${fileExt}`
      },
      { name, ...options }
    )

    pkg.vue.pages['devtools'] = {
      entry: `src/devtools/main.${fileExt}`,
      template: 'public/browser-extension.html',
      title: 'Devtools'
    }
  }

  if (options.generateSigningKey === true) {
    api.render((files) => {
      files['key.pem'] = generateKey()
    })
  }

  api.onCreateComplete(() => {
    const gitignoreFile = api.resolve('./.gitignore')
    const gitignore = fs.readFileSync(gitignoreFile, 'utf8')

    const gitignoreSnippet = gitignoreRules
      .filter((rule) => !new RegExp(`^${regexEscape(rule)}$`, 'gm').test(gitignore))
      .join('\n')
    if (gitignoreSnippet !== '' && gitignoreSnippet !== gitignoreRules[0]) {
      fs.writeFileSync(gitignoreFile, gitignore + '\n' + gitignoreSnippet + '\n')
    }

    if (hasTs) {
      const tsconfigFile = api.resolve('./tsconfig.json')
      const tsconfig = require(tsconfigFile)

      if (!tsconfig.compilerOptions.types.includes('firefox-webext-browser')) {
        tsconfig.compilerOptions.types.push('firefox-webext-browser')
      }

      fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 2))
    }
  })
}
