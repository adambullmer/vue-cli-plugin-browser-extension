<template>
  <div>
    <p>{{ defaultText }}</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
<%_ if (options.usePolyfill && !options.autoImportPolyfill) { -%>
import browser from 'webextension-polyfill'
<%_ } -%>
export default Vue.extend({
  name: 'HelloWorld',
  mounted () {
    <%- options.api %>.runtime.sendMessage({})
  },
  computed: {
    defaultText () {
      return <%- options.api %>.i18n.getMessage('extName')
    }
  }
})
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
