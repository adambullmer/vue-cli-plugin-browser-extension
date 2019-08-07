import store from './store'
<%_ if (options.usePolyfill && !options.autoImportPolyfill) { -%>
import browser from 'webextension-polyfill'
<%_ } -%>

<%_ if (options.popupPage) { -%>
<%- options.api %>.runtime.onMessage.addListener(function (request, sender, sendResponse) {
<%_ } else { -%>
<%- options.api %>.browserAction.onClicked.addListener(function (tab) {
<%_ } -%>
  console.log('Hello from the background')
  <%_ if (options.components.contentScripts) { -%>

  <%- options.api %>.tabs.executeScript({
    file: 'content-script.js',
  });
  <%_ } -%>
})
