<template>
  <div>
    <p>{{ defaultText }}</p>
  </div>
</template>

<script>
<%_ if (options.usePolyfill && !options.autoImportPolyfill) { -%>
import browser from 'webextension-polyfill'
<%_ } -%>
export default {
  name: 'HelloWorld',
  mounted () {
    <%- options.api %>.runtime.sendMessage({})
  },
  computed: {
    defaultText() {
      return <%- options.api %>.i18n.getMessage('extName');
    }
  }
}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
