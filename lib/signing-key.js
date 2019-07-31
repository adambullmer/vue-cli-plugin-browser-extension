const { existsSync } = require('fs')
const { exec, execSync } = require('child_process')

exports.keyExists = (keyFile) => existsSync(keyFile)

exports.generateKey = () => execSync('openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt')

exports.hashKey = (keyFile) =>
  new Promise((resolve, reject) => {
    exec(`openssl rsa -in ${keyFile} -pubout -outform DER | openssl base64 -A`, (error, stdout) => {
      if (error) {
        // node couldn't execute the command
        return reject(error)
      }
      resolve(stdout)
    })
  })
