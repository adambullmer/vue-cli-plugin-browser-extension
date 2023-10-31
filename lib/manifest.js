const logger = require('@vue/cli-shared-utils')
const { keyExists, hashKey } = require('./signing-key')
const validPackageSync = ['version', 'description']

function getManifestJsonString ({ manifestTransformer }, manifest) {
  if (manifestTransformer && typeof manifestTransformer === 'function') {
    const manifestCopy = JSON.parse(JSON.stringify(manifest))
    manifest = manifestTransformer(manifestCopy)
  }
  return JSON.stringify(manifest, null, 2)
}

function syncManifestWithPackageJson ({ manifestSync }, packageJson, manifest) {
  validPackageSync.forEach((property) => {
    if (manifestSync.includes(property)) {
      manifest[property] = packageJson[property]
    }
  })
}

const defaultCsp = "script-src 'self' 'unsafe-eval'; object-src 'self'"

module.exports = (api, pluginOptions, packageJson) => async (content) => {
  const manifest = JSON.parse(content)
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = keyExists(keyFile)
  const isProduction = api.service.mode === 'production'

  syncManifestWithPackageJson(pluginOptions, packageJson, manifest)

  if (manifest.manifest_version === 3) {
    manifest.content_security_policy = Object.assign(
      {
        extension_pages: defaultCsp
      },
      manifest.content_security_policy
    )
  } else {
    manifest.content_security_policy =
      manifest.content_security_policy || defaultCsp
  }

  // validate manifest

  // If building for production (going to web store) abort early.
  // The browser extension store will hash your signing key and apply CSP policies.
  if (isProduction) {
    if (manifest.manifest_version === 3) {
      manifest.content_security_policy.extension_pages = manifest.content_security_policy.extension_pages.replace(/'unsafe-eval'/, '')
    } else {
      manifest.content_security_policy = manifest.content_security_policy.replace(/'unsafe-eval'/, '')
    }

    // validate minimum options

    return getManifestJsonString(pluginOptions, manifest)
  }

  if (hasKeyFile) {
    try {
      manifest.key = await hashKey(keyFile)
    } catch (error) {
      logger.error('Unexpected error hashing keyfile:', error)
    }
  }

  // It's possible to specify the hashed key property manually without a keyfile local in the repo
  if (!manifest.key) {
    logger.warn('No key.pem file found. This is fine for dev, however you may have problems publishing without one')
  }

  return getManifestJsonString(pluginOptions, manifest)
}
