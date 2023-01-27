<template>
  <div class="wrap" @scroll="scrollEvent" ref="wrap">
    <div class="phantom"></div>
    <div class="content">
      <div class="a-content" :data-virtual-id="item.index" ref="items" v-for="(item, index) in virtualData">
        {{ item.index + "," + item.val }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUpdated } from "vue";

const props = defineProps({
  itemHeight: {
    type: Number,
    default: 30,
  },
});

const data: string[] = [];
const positions = ref(Array(10000).fill(0));
let wrapHeight = 0;
const start = ref(0);
const end = ref(0);
const contentOffset = ref(0);
const phantomHeight = ref(0);
const wrap = ref();
const items = ref();

for (let i = 0; i < 10000; i++) {
  data.push("我很帅".repeat(Math.ceil(Math.random() * 8)));
}
positions.value = positions.value.map((_, index) => {
  return {
    index,
    top: index * props.itemHeight,
    bottom: (index + 1) * props.itemHeight,
    height: props.itemHeight,
  };
});

const listData = computed(() => {
  return data.map((val, index) => {
    return {
      index: index,
      val,
    };
  });
});
const virtualData = computed(() => {
  return listData.value.slice(start.value, end.value);
});
const virtualCount = computed(() => {
  return Math.ceil(wrapHeight / props.itemHeight);
});

const scrollEvent = () => {
  const scrollTop = wrap.value.scrollTop;
  start.value = getActiveStart(scrollTop);
  end.value = start.value + virtualCount.value;
  setStartOffset();
};

const getActiveStart = (value: number): number => {
  let l = 0,
    r = positions.value.length - 1;
  while (l < r) {
    const mid = Math.floor((r + l) / 2);
    const midVal = positions.value[mid].bottom;
    if (midVal === value) {
      return mid + 1;
    } else if (midVal < value) {
      l = mid + 1;
    } else {
      r = mid;
    }
  }
  return l;
};

const setStartOffset = () => {
  contentOffset.value =
    start.value >= 1 ? positions.value[start.value - 1].bottom : 0;
};

const update = () => {
  nextTick(() => {
    if (!items || !items.value.length) return;
    updateItemSize();
    phantomHeight.value = positions.value[positions.value.length - 1].bottom;
    setStartOffset();
  });
};

const updateItemSize = () => {
  let diff = 0
  items.value.forEach((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const height = rect.height;
    const idx = Number(node.dataset.virtualId);
    const dOldValue = positions.value[idx].height - height;
    diff += dOldValue
    positions.value[idx].height = height;
    if (diff !== 0) {
      positions.value[idx].bottom -= diff;
    }
    idx + 1 < positions.value.length && (positions.value[idx + 1].top = positions.value[idx].bottom)

  })
  if (diff !== 0) {
    const id = Number(items.value[items.value.length - 1].dataset.virtualId)
    const n = positions.value.length
    for (let i = id + 1; i < n; i++) {
      positions.value[i].top = positions.value[i - 1].bottom;
      positions.value[i].bottom -= diff;
    }
  }
  // items.value.forEach((node: HTMLElement) => {
  //   const rect = node.getBoundingClientRect();
  //   const height = rect.height;
  //   const idx = Number(node.dataset.virtualId);
  //   const dOldValue = positions.value[idx].height - height;
  //   if (dOldValue) {
  //     positions.value[idx].height = height;
  //     positions.value[idx].bottom -= dOldValue;
  //     for (let i = idx + 1; i < positions.value.length; i++) {
  //       positions.value[i].top = positions.value[i - 1].bottom;
  //       positions.value[i].bottom -= dOldValue;
  //     }
  //   }
  // });
};

var intersectionObserver = new IntersectionObserver(function (entries) {
  console.log(entries);
  console.log("Loaded new items");
});

onMounted(() => {
  wrapHeight = wrap.value.offsetHeight;
  end.value = virtualCount.value;
  intersectionObserver.observe(wrap.value);
});
onUpdated(() => {
  update();
});
</script>

<style scoped>
.wrap {
  height: 100vh;
  width: 300px;
  background-color: #fcc;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  position: relative;
}

.a-content {
  overflow: hidden;
  white-space: break-all;
  white-space: pre-line;
  word-break: break-word;
  text-align: left;
  max-width: 260px;
}

.content {
  position: absolute;
  top: 0;
  transform: translate3d(0, v-bind("contentOffset + 'px'"), 0);
}

.phantom {
  height: v-bind("phantomHeight + 'px'");
}
</style>
