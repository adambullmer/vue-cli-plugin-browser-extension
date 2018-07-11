module.exports = (api, { config }) => {
  const pkg = {
    scripts: {
      'ext-serve': 'vue-cli-service ext-serve'
    },
    devDependencies: {
      'vue-cli-plugin-build-watch': '^1.0.0'
    }
  }

  api.extendPackage(pkg)
}
