module.exports = [
  {
    name: 'components',
    type: 'checkbox',
    defaults: ['popup', 'background'],
    message: 'Which browser extension components do you wish to generate?',
    choices: [
      {
        name: 'Background script',
        value: 'background',
        short: 'background',
        checked: true
      },
      {
        name: 'Browser Action Popup',
        value: 'popup',
        short: 'popup',
        checked: true
      },
      {
        name: 'Options Page',
        value: 'options',
        short: 'options'
      },
      {
        name: 'Content Scripts',
        value: 'contentScripts',
        short: 'content scripts'
      },
      {
        name: 'Standalone Tab',
        value: 'standalone',
        short: 'standalone'
      // },
      // {
      //   name: 'Dev Tools Tab',
      //   value: 'devTools',
      //   short: 'dev tools'
      }
    ],
    filter: async (input) => {
      const componentMap = {}

      input.forEach((component) => {
        componentMap[component] = true
      })

      return componentMap
    }
  },
  {
    name: 'api',
    type: 'list',
    default: 'browser',
    message: 'Which extension API do you wish to use?',
    choices: [
      {
        name: 'browser (WebExtension)',
        value: 'browser'
      },
      {
        name: 'chrome',
        value: 'chrome'
      }
    ]
  },
  {
    name: 'usePolyfill',
    type: 'confirm',
    message: 'Add WebExtension polyfill?',
    default: true,
    when: answers => answers.api === 'browser'
  },
  {
    name: 'autoImportPolyfill',
    type: 'confirm',
    message: 'Make polyfill available without import?',
    default: true,
    when: answers => answers.usePolyfill
  }
]
