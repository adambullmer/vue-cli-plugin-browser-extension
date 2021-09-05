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

function getDefaultManifestAttributes (manifest, production) {
  switch (manifest.manifest_version) {
    case 2:
      // Set reasonable defaults for manifest V2:
      return {
        content_security_policy: "script-src 'self'" + (production ? '' : " 'unsafe-eval'") + "; object-src 'self'"
      }

    case 3:
      // Set reasonable defaults for manifest V3:
      return {
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self'",
          sandbox: "script-src 'self'" + (production ? '' : " 'unsafe-eval'") + "; object-src 'self'"
        }
      }

    default:
      // Issue a warning if an unsupported manifest version is detected:
      logger.warn(`Unsupported manifest version '${manifest.manifest_version}'; no manifest defaults will be applied`)
      return {}
  }
}

module.exports = (api, pluginOptions, packageJson) => async (content) => {
  const userManifest = JSON.parse(content)
  const keyFile = api.resolve('key.pem')
  const hasKeyFile = keyExists(keyFile)
  const isProduction = api.service.mode === 'production'

  syncManifestWithPackageJson(pluginOptions, packageJson, userManifest)

  // Apply manifest defaults:
  const manifestDefaults = getDefaultManifestAttributes(userManifest, isProduction)
  const manifest = Object.assign(manifestDefaults, userManifest)

  // validate manifest

  // If building for production (going to web store) abort early.
  // The browser extension store will hash your signing key and apply CSP policies.
  if (isProduction) {
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
