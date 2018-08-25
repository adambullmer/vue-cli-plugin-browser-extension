const fs = require('fs')
const path = require('path')
const gitignoreSnippet = `
# Vue Browser Extension Output
*.pem
*.pub
*.zip
/dist-zip
`

module.exports = (api, options) => {
  const appRootPath = process.cwd()
  const { name } = require(path.join(appRootPath, 'package.json'))
  const eslintConfig = { env: { webextensions: true } }
  const pkg = {
    private: true,
    scripts: {
      'serve': 'vue-cli-service build --mode development --watch'
    },
    dependencies: {
      'vue-router': '^3.0.1',
      'vuex': '^3.0.1'
    },
    vue: {
      pages: {},
      pluginOptions: {
        browserExtension: { options }
      }
    }
  }

  if (options.usePolyfill) {
    pkg.dependencies['webextension-polyfill'] = '^0.3.0'
    pkg.devDependencies = {
      'imports-loader': '^0.8.0'
    }
  }

  if (api.hasPlugin('eslint')) {
    console.log('Adding eslint config stuffs')
    pkg.eslintConfig = eslintConfig
  }

  api.extendPackage(pkg)
  api.render('./template/base-app', { name, ...options })

  if (options.components.popup) {
    api.render('./template/popup', { name, ...options })

    pkg.vue.pages['popup/popup'] = {
      entry: 'src/popup/popup.js',
      title: 'Popup'
    }
  }

  if (options.components.options) {
    api.render('./template/options', { name, ...options })

    pkg.vue.pages['options/options'] = {
      entry: 'src/options/options.js',
      title: 'Options'
    }
  }

  if (options.components.standalone) {
    console.log('Generating standalone app')
    api.render('./template/standalone', { name, ...options })

    pkg.vue.pages['standalone/standalone'] = {
      entry: 'src/standalone/standalone.js',
      filename: 'app.html',
      title: name
    }
  }

  if (options.components.contentScript) {
    api.render('./template/content-script', { ...options })
  }

  api.onCreateComplete(() => {
    const gitignore = fs.readFileSync(api.resolve('./.gitignore'), 'utf8')
    fs.writeFileSync(api.resolve('./.gitignore'), gitignore + gitignoreSnippet)
  })
}
