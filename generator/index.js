module.exports = (api, { config }) => {
  const eslintConfig = { env: { webextensions: true } }
  const pkg = {
    scripts: {
      'ext-serve': 'vue-cli-service ext-serve'
    },
    dependencies: {
      'vue-router': '^3.0.1',
      'vuex': '^3.0.1'
    }
  }

  if (api.hasPlugin('eslint')) {
    console.log('Adding eslint config stuffs')
    pkg.eslintConfig = eslintConfig
  }

  api.extendPackage(pkg)
  api.render('./template')
}
