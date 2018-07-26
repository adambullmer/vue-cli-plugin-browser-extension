module.exports = [
  {
    name: 'components',
    type: 'checkbox',
    default: ['popup'],
    message: 'Which browser extension components do you wish to generate?',
    choices: [
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
        name: 'Content Script',
        value: 'contentScript',
        short: 'content script'
      // },
      // {
      //   name: 'Standalone Tab',
      //   value: 'standalone',
      //   short: 'standalone'
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
  }
]
