<template>
  <h1>{{ defaultText }}</h1>
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
  },
  computed: {
    defaultText() {
      return <%- options.api %>.i18n.getMessage('extName');
    }
  }
}
</script>
