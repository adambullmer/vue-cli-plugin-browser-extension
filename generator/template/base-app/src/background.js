import store from './store'

<%_ if (options.popupPage) { -%>
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {<%_ } else { -%>
chrome.browserAction.onClicked.addListener(function (tab) {<%_ } -%>
  console.log(`Hello ${store.getters.foo}!`)

  <%_ if (options.contentScript) { -%>
  chrome.tabs.executeScript({
    file: 'content-script.js',
  });
  <%_ } -%>
})
