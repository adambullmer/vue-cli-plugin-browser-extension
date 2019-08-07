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

<style>
html {
  width: 400px;
  height: 400px;
}
</style>
