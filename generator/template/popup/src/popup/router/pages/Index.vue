<template>
  <p>Hello world!</p>
</template>

<script>
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
