#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const zipFolder = require('zip-folder')

const appRootPath = process.cwd()
const DEST_DIR = process.argv[2]
const DEST_ZIP_DIR = path.join(appRootPath, `${DEST_DIR}-zip`)
const { name, version } = require(path.join(appRootPath, 'package.json'))

const makeDestZipDirIfNotExists = () => {
  if (!fs.existsSync(DEST_ZIP_DIR)) {
    fs.mkdirSync(DEST_ZIP_DIR)
  }
}

const buildZip = (src, dist, zipFilename) => {
  console.info(`Building ${zipFilename}...`)

  return new Promise((resolve, reject) => {
    zipFolder(src, path.join(dist, zipFilename), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const main = () => {
  const zipFilename = `${name}-v${version}.zip`

  makeDestZipDirIfNotExists()

  buildZip(DEST_DIR, DEST_ZIP_DIR, zipFilename)
    .then(() => console.info('OK'))
    .catch(console.err)
}

main()
