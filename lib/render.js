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

function getDomainFile (api, domain, filename) {
  const baseFile = `../generator/template/${filename}`
  const relativeDomainFile = `../generator/template/${domain}/src/${domain}/${filename}`
  const domainFile = api.resolve(relativeDomainFile)

  return fs.existsSync(domainFile) ? relativeDomainFile : baseFile
}

exports.renderDomain = ({ api, title, fileExt, filename, options, hasMinimumSize = false }) => {
  const domain = title.toLowerCase()
  const app = `./src/${domain}/App.vue`
  const entry = `./src/${domain}/main.${fileExt}`
  const template = 'public/browser-extension.html'
  const domainApp = getDomainFile(api, domain, `App.${fileExt}.vue`)
  const domainEntry = getDomainFile(api, domain, 'main.js')

  api.render(
    {
      [app]: domainApp,
      [entry]: domainEntry
    },
    { ...options, hasMinimumSize }
  )

  const page = { template, entry, title }
  if (filename !== undefined) {
    page.filename = filename
  }

  api.extendPackage({ vue: { pages: { [domain]: page } } })
}
