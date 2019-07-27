import Vue from 'vue'
import App from './App'
import store from '../store'
import router from './router'

<%- options.api %>.devtools.panels.create(<%- options.api %>.i18n.getMessage('extName'), '/assets/logo.png', 'devtools/devtools.html');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App)
})
