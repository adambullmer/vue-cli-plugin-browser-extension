<%_ if (options.components.popup) { -%>
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
<%_ } else { -%>
browser.browserAction.onClicked.addListener(function (tab) {
<%_ } -%>
  console.log('Hello from the background')
  <%_ if (options.components.contentScripts) { -%>

  browser.tabs.executeScript({
    file: 'content-script.js',
  });
  <%_ } -%>
})
