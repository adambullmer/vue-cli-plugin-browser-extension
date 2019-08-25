<template>
  <hello-world />
</template>

<script lang="ts">
import Vue from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'

export default Vue.extend({
  name: 'App',
  components: { HelloWorld }
})
</script>
<%_ if (hasMinimumSize === true) { -%>

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
<%_ } -%>
