import store from './store'

<%_ if (options.popupPage) { -%>
<%- options.api %>.runtime.onMessage.addListener(function (request, sender, sendResponse) {<%_ } else { -%>
<%- options.api %>.browserAction.onClicked.addListener(function (tab) {<%_ } -%>
  console.log(`Hello ${store.getters.foo}!`)

  <%_ if (options.contentScript) { -%>
  <%- options.api %>.tabs.executeScript({
    file: 'content-script.js',
  });
  <%_ } -%>
})
