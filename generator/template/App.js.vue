<template>
  <hello-world />
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'App',
  components: { HelloWorld }
}
</script>
<%_ if (hasMinimumSize === true) { -%>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
<%_ } -%>
