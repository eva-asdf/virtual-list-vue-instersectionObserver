import type { Ref } from "vue";
import { nextTick, onUpdated } from "vue";

type Positions = {
  index: number;
  top: number;
  bottom: number;
  height: number;
};

export function itemHeightNotFixedFn(
  items: Ref<any>,
  contentOffset: Ref<number>,
  phantomHeight: Ref<number>,
  start: Ref<number>,
  end: Ref<number>,
  bufferLength: number,
  contianerHeight: number,
  len: number,
  bottomHalf: number,
  topHalf: number,
  updateNotification: Function,
  dataLength: { total: number },
  positions: Array<Positions>
) {
  const updateItemSize = () => {
    let diff = 0;
    items.value.forEach((node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      const height = rect.height;
      const idx = Number(node.dataset.virtualId);
      const dOldValue = positions[idx].height - height;
      diff += dOldValue;
      positions[idx].height = height;
      if (diff !== 0) {
        positions[idx].bottom -= diff;
      }
      idx + 1 < positions.length &&
        (positions[idx + 1].top = positions[idx].bottom);
    });
    if (diff !== 0) {
      const id = Number(items.value[items.value.length - 1].dataset.virtualId);
      const n = positions.length;
      for (let i = id + 1; i < n; i++) {
        positions[i].top = positions[i - 1].bottom;
        positions[i].bottom -= diff;
      }
    }
  };
  const setStartOffset = () => {
    contentOffset.value =
      start.value >= 1 ? positions[start.value - 1].bottom : 0;
  };
  const getActiveStart = (value: number): number => {
    let l = 0,
      r = positions.length - 1;
    while (l < r) {
      const mid = Math.floor((r + l) / 2);
      const midVal = positions[mid].bottom;
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
  const setPositions = (id: number, flag: "top" | "bottom" | "other") => {
    switch (flag) {
      case "top":
        if (id < bufferLength) {
          start.value = 0;
          end.value = len;
        } else if (id + 2 * bufferLength > dataLength.total) {
          start.value = dataLength.total - 3 * bufferLength;
          end.value = dataLength.total;
          updateNotification();
        } else {
          start.value = id - bufferLength;
          end.value = id + 2 * bufferLength;
        }
        break;
      case "bottom":
        if (id < 2 * bufferLength) {
          start.value = 0;
          end.value = len;
        } else if (id + bufferLength > dataLength.total) {
          updateNotification();
          start.value = dataLength.total - 3 * bufferLength;
          end.value = dataLength.total;
        } else {
          start.value = id - 2 * bufferLength;
          end.value = id + bufferLength;
        }
        break;
      case "other":
        if (id < topHalf) {
          start.value = 0;
          end.value = len;
        } else if (id + bottomHalf > dataLength.total) {
          start.value = dataLength.total - len;
          end.value = dataLength.total;
          updateNotification();
        } else {
          start.value = id - topHalf;
          end.value = id + bottomHalf;
        }
        break;
      default:
        console.log("default");
        break;
    }
    setStartOffset();
  };
  const isInvalidRender = (scrollTop: number) => {
    return (
      scrollTop + contianerHeight > positions[end.value - 1].bottom ||
      scrollTop < positions[start.value].top
    );
  };
  onUpdated(() => {
    nextTick(() => {
      if (!items || !items.value.length) return;
      updateItemSize();
      phantomHeight.value = positions[positions.length - 1].bottom;
      setStartOffset();
    });
  });
  return { setPositions, getActiveStart, isInvalidRender };
}
