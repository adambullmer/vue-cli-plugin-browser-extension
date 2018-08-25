<template>
  <p>Hello world!</p>
</template>

<script>
<%_ if (options.usePolyfill && !options.autoImportPolyfill) { -%>
import browser from 'webextension-polyfill'
<%_ } -%>

export default {
  data () {
    return {}
  },
  mounted () {
    <%- options.api %>.runtime.sendMessage({})
  }
}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
