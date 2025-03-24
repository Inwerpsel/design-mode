import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
} from 'react';

const stats = {};
const handles = {};
let debugMode = false;
let debugSwitchCount = 0;

const getDebugMode = () => debugMode;

export const flipDebugMode = () => {
  ++debugSwitchCount;
  debugMode = !debugMode;
  console.log(`DEBUG MODE ${debugMode ? 'on' : 'off'}`)
  // Trigger a render in all components by calling their refresh handle.
  // Components keep track of the last debug mode to know whether a render was the result of a forced refresh.
  // So this render does not result in the render count incrementing, which stays consistent with the container's
  // render count.
  for (const id in handles) {
    handles[id](debugSwitchCount);
  }
};

export function RenderInfo() {
  const id = useId();
  const lastDebugMode = useRef(getDebugMode());
  const [, forceRefresh] = useState();

  useEffect(() => {
    handles[id] = forceRefresh;
    return () => {
      delete handles[id];
      delete stats[id];
    };
  }, []);

  const renderCount = useRef(0);
  // This is probably prone to race conditions.
  if (lastDebugMode.current !== getDebugMode()) {
    lastDebugMode.current = getDebugMode();
  } else {
    renderCount.current++;
  }
  stats[id] = renderCount.current;

  useLayoutEffect(() => {
    if (!getDebugMode()) {
      return;
    }
    const max = Math.max(...Object.values(stats));
    document.documentElement.style.setProperty('--max-tracked-renders', `${max}`);
  });

  if (!getDebugMode()) {
    return null;
  }

  return <span className={'render-info'} style={{'--current-renders': `${renderCount.current}`}}>
      [{renderCount.current}] {Math.round(performance.now())}
  </span>;
}
