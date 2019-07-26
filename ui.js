module.exports = (api) => {
  api.describeTask({
    match: /vue-cli-service ext-serve/,
    description: 'com.adambullmer.browserExt.tasks.extServe.description',
    link: 'https://github.com/adambullmer/vue-cli-browser-extension'
  })
}
