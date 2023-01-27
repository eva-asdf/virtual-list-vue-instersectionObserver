import type { Ref } from "vue";

export function itemHeightFixedFn(
  contentOffset: Ref<number>,
  start: Ref<number>,
  end: Ref<number>,
  contianerHeight:number,
  itemHeight: number,
  bufferLength: number,
  len: number,
  bottomHalf: number,
  topHalf: number,
  updateNotification: Function,
  dataLength: { total: number }
) {
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
    contentOffset.value = start.value * itemHeight;
  };

  const isInvalidRender = (scrollTop:number) => {
    return (
      scrollTop + contianerHeight > end.value * itemHeight ||
      scrollTop < start.value * itemHeight
    );
  };
  return { setPositions, isInvalidRender };
}
