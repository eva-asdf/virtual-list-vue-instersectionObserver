<template>
  <div class="list" ref="wrap">
    <div class="phantom"></div>
    <div class="content">
      <div class="list-item" v-for="item in show" ref="items" :data-virtual-id="item.index">
        <slot name="list" v-bind:item="item"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUpdated, watch } from "vue";
import type { Ref } from "vue";
import { itemHeightFixedFn } from './useItemHeightFix'
import { itemHeightNotFixedFn } from './useItemHeightNotFixed'

type Props = {
  contianerHeight: number;
  itemHeight: number;
  isItemHeightFixed: boolean; // 是不是固定宽高
  data: Array<unknown>;
};

type Positions = {
  index: number;
  top: number;
  bottom: number;
  height: number;
};

const emit = defineEmits(['updateData'])

const wrap = ref();
const items = ref();

const props = defineProps<Props>();
const itemSize = Math.ceil(props.contianerHeight / props.itemHeight)


const bufferLength = itemSize;
const start = ref(0);
const end = ref(2 * bufferLength + itemSize)


const len = end.value
const topHalf = Math.floor(len / 2)
const bottomHalf = len - topHalf
const q1 = Math.floor((bufferLength * 2) / 3)
const q3 = Math.floor((bufferLength * 1) / 3) + bufferLength + itemSize

let dataLength = {
  total: props.data.length
}
const phantomHeight: Ref<number> = ref(props.itemHeight * dataLength.total)
const contentOffset = ref(0)

const dataList = computed(() => {
  return props.data.map((val, index) => {
    return {
      index,
      value: val,
    };
  });
});

const show = computed(() => {
  return dataList.value.slice(start.value, end.value);
});

const emitUpdate = () => {
  emit('updateData')
}
emitUpdate.flag = true

const updateNotification = () => {
  if (emitUpdate.flag) {
    emitUpdate()
    emitUpdate.flag = false
  }
}

let setPositions: Function
let getActiveStart: Function
let isInvalidRender: Function
let positions: Array<Positions>
if (props.isItemHeightFixed) {
  let { setPositions: sp, isInvalidRender: ivr } = itemHeightFixedFn(
    contentOffset,
    start,
    end,
    props.contianerHeight,
    props.itemHeight,
    bufferLength,
    len,
    bottomHalf,
    topHalf,
    updateNotification,
    dataLength
  )
  setPositions = sp
  isInvalidRender = ivr
} else {
  positions = Array(props.data.length).fill(0).map((_, index) => {
    return {
      index,
      top: index * props.itemHeight,
      bottom: (index + 1) * props.itemHeight,
      height: props.itemHeight,
    }
  })
  let { setPositions: sp, getActiveStart: gas, isInvalidRender: ivr } = itemHeightNotFixedFn(
    items,
    contentOffset,
    phantomHeight,
    start,
    end,
    bufferLength,
    props.contianerHeight,
    len,
    bottomHalf,
    topHalf,
    updateNotification,
    dataLength,
    positions
  )
  setPositions = sp
  getActiveStart = gas
  isInvalidRender = ivr
}

let timer: NodeJS.Timeout | null;
let callback = (event: IntersectionObserverEntry[]) => {
  // 初始化时不执行
  callback = (event: IntersectionObserverEntry[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const scrollTop = wrap.value.scrollTop;
      if (
        isInvalidRender(scrollTop)
      ) {
        const id = getActiveStart(scrollTop);
        setPositions(id, "top");
      }
    }, 500);
    event.forEach((val) => {
      if (val.isIntersecting) {
        if (
          val.target.classList.contains("__q1") ||
          val.target.classList.contains("__q3")
        ) {
          updateData(
            Number((val.target as HTMLElement).dataset.virtualId),
            val.boundingClientRect.top,
            val.boundingClientRect.bottom
          );
        }
      }
    });
  };
};
// 更新时将触发元素作为更新后的中点
const updateData = (id: number, top: number, bottom: number) => {
  if (top < 0) {
    setPositions(id, "top");
  } else if (bottom > props.contianerHeight) {
    setPositions(id, "bottom");
  } else {
    // 快速拉动滚动条造成的现象，原理暂不知道
    setPositions(id, "other");
  }
};


console.log(props);

watch(
  props.data,
  (newVal, oldVal) => {
    emitUpdate.flag = true
    if (props.isItemHeightFixed) {
      dataLength.total = newVal.length
      phantomHeight.value = dataLength.total * props.itemHeight
    } else if (positions) {
      console.log('p');
      const m = newVal.length
      const totalHeight = positions[positions.length - 1].bottom
      for (let i = dataLength.total, c = 0; i < m; i++, c++) {
        positions.push({
          index: i,
          top: totalHeight + c * props.itemHeight,
          bottom: totalHeight + (c + 1) * props.itemHeight,
          height: props.itemHeight
        })
      }
      dataLength.total = m
      phantomHeight.value = positions[positions.length - 1].bottom
    }
  })
let observer: IntersectionObserver;

onMounted(() => {
  // 设置监听点
  items.value[q1].classList.add("__q1");
  items.value[q3].classList.add("__q3");
  observer = new IntersectionObserver((e) => callback(e), {
    root: wrap.value,
    threshold: 0,
  });
  items.value?.forEach((val: any) => {
    observer.observe(val);
  });
});

/** 
// 由于intersection的懒加载的原因，快速拖动滚动条时监听不到，无法更新数据，造成白屏，所以在更新节点时，再加判断是否更新，
// 但是还有缺陷，所以最后 在 callback那里再处理
let timer: NodeJS.Timeout | null
onUpdated(() => {
  console.log('onUpdated');
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    console.log('setTimeout');
    const scrollTop = wrap.value.scrollTop
    if (scrollTop + props.contianerHeight > end.value * props.itemHeight || scrollTop < start.value * props.itemHeight) {
      // 滚动到屏幕外造成白屏
      // if (scrollTop + props.contianerHeight > end.value * props.itemHeight || scrollTop < start.value * props.itemHeight) {
      //   updateFlag = false
      // }
      const id = Math.floor(scrollTop / props.itemHeight)
      setPositions(id, 'top')
    } else {
      console.log('else');
    }
  }, 500);
})
*/
</script>

<style scoped>
.list {
  height: v-bind("props.contianerHeight + 'px'");
  width: 100%;
  overflow-y: auto;
  position: relative;
  padding: 0;
  margin: 0;
  transform: translate(0);
}

.phantom {
  height: v-bind("phantomHeight + 'px'");
}


.content {
  position: absolute;
  top: 0;
  transform: translate3d(0, v-bind("contentOffset + 'px'"), 0);
}
</style>
