module.exports = [
  {
    name: 'popupPage',
    type: 'confirm',
    default: true,
    message: 'Generate a browser action popup? (https://developer.chrome.com/extensions/user_interface#browser_action)'
  }, {
    name: 'optionsPage',
    type: 'confirm',
    default: false,
    message: 'Generate an options page? (https://developer.chrome.com/extensions/options)'
  }
]
