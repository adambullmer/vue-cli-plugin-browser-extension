import Vue from 'vue'
import App from './App.vue'

<%- options.api %>.devtools.panels.create(<%- options.api %>.i18n.getMessage('extName'), '/assets/logo.png', 'devtools.html');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
})
