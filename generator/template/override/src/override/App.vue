<template>
  <div>
    <p>{{ defaultText }}</p>
  </div>
</template>

<script>
export default {
  name: 'App',
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
