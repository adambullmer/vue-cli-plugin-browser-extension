import store from './store'

chrome.browserAction.onClicked.addListener(function (tab) {
  console.log(`Hello ${store.getters.foo}!`)
})
