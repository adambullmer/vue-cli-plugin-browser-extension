const fs = require('fs')
const gitignoreRules = ['# Vue Browser Extension Output', '*.pem', '*.pub', '*.zip', '/artifacts']
const regexEscape = (rule) => rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

exports.renderTs = (api) => {
  const tsconfigFile = api.resolve('./tsconfig.json')
  const tsconfig = require(tsconfigFile)

  if (!tsconfig.compilerOptions.types.includes('firefox-webext-browser')) {
    tsconfig.compilerOptions.types.push('firefox-webext-browser')
  }

  fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, null, 2))
}

exports.renderGitignore = (api) => {
  const gitignoreFile = api.resolve('./.gitignore')
  const gitignore = fs.readFileSync(gitignoreFile, 'utf8')

  const gitignoreSnippet = gitignoreRules
    .filter((rule) => !new RegExp(`^${regexEscape(rule)}$`, 'gm').test(gitignore))
    .join('\n')
  if (gitignoreSnippet !== '' && gitignoreSnippet !== gitignoreRules[0]) {
    fs.writeFileSync(gitignoreFile, gitignore + '\n' + gitignoreSnippet + '\n')
  }
}

exports.renderDomain = ({ api, title, ext, filename, options }) => {
  const domain = title.toLowerCase()
  const entry = `./src/${domain}/main.${ext}`
  const template = 'public/browser-extension.html'

  api.render(
    {
      [`./src/${domain}/App.vue`]: `../generator/template/${domain}/src/${domain}/App.${ext}.vue`,
      [entry]: `../generator/template/${domain}/src/${domain}/main.js`
    },
    options
  )

  const page = { template, entry, title }
  if (filename !== undefined) {
    page.filename = filename
  }

  api.extendPackage({ vue: { pages: { [domain]: page } } })
}
