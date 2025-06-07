
export function onLongPress(callback) {
  let timeout;
  let preventClick = true;

  function start(downEvent) {
    preventClick = false;
    timeout = setTimeout(() => {
      preventClick = true;
      setTimeout(() => {preventClick = false}, 400)
      // Pass the pointer down event so that things like x and y coords can be used.
      callback(downEvent);
    }, 400);
  }

  function clear() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  }

  function clickCaptureHandler(e) {
    if (preventClick) {
      e.stopPropagation();
      e.preventDefault();
      preventClick = false;
    }
  }

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onTouchEnd: clear,
    onDrag: clear,

    onClickCapture: clickCaptureHandler
  };
}