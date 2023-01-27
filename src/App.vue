<template>
  <!-- <Virtual-list></Virtual-list> -->
  <div class="app">
    <virtual-list-vue :item-height="30" :contianer-height="400" :is-item-height-fixed="false" :data="data"
      @update-data="updateData">
      <template #list="{ item }">
        <div>{{ item.index + ',' + item.value }}</div>
      </template>
    </virtual-list-vue>
  </div>

</template>

<script setup lang="ts">
import VirtualList from "./components/onscroll/VirtualList.vue";
import VirtualListVue from "./components/intersectionObsever/VirtualList.vue";
import { ref } from "vue";
import type { Ref } from "vue";
const data: Ref<string[]> = ref([])

for (let i = 0; i < 100; i++) {
  data.value.push("我很帅".repeat(Math.ceil(Math.random() * 30)));
}

const updateData = () => {
  console.log('update');
  setTimeout(() => {
    const arr = []
    for (let i = 0; i < 100; i++) {
      arr.push("我很帅".repeat(Math.ceil(Math.random() * 30)));
    }
    data.value.push(...arr)
  }, 1000);
}
</script>

<style scoped>

</style>
