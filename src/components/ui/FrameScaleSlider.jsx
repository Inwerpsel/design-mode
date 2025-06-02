import React from 'react';
import { get, use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';

// Display values > 1 closer to each other.
const overOneScale = 5;

const config = {
  min: 0.2,
  step: 0.02,
};


export function FrameScaleSlider() {
  const [scales, setScales] = use.scales();
  const { width, height } = get;

  const scale = parseFloat(scales[`${width}x${height}`] || 1);
  const normalized = scale <= 1 ? scale : (1 + (scale - 1) / overOneScale)

  const key = `${width}x${height}`;

  const updateScales = (e) => {
    const raw = e.target.value;
    const n = raw <= 1 ? raw : (1 + (raw-1) * overOneScale).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    setScales({ ...scales, [key]: n});
  };

  function scrollScale(event) {
    const delta = Math.round(event.deltaY / 100);
    const newScale = Math.max(0.2, scale + delta * config.step);
    setScales({ ...scales, [key]: newScale.toFixed(2)});
  }

  return (
    <div onWheelCapture={scrollScale} className={'frame-scale-slider'} style={{ minWidth: '200px' }}>
      <input
        style={{margin: 0, marginTop: '-4px'}}
        type="range"
        list="scale-points"
        value={normalized}
        max={1.4}
        {...config}
        onChange={updateScales}
      />
      <input
        style={{verticalAlign: 'top'}}
        type="number"
        max={3}
        value={scale}
        {...config}
        onChange={(e) =>
          setScales({ ...scales, [key]: e.target.value })
        }
      />
      <datalist id="scale-points">
        <option value="1" />
        <option value="1.2" />
        <option value="1.4" />
      </datalist>
      <Tutorial tasks={[
        get => [
          'Zoom in or out',
          scale !== 1,
        ],
      ]} el={FrameScaleSlider}>
        Zoom in and out here. You can also scroll above the element.
      </Tutorial>
    </div>
  );
}

FrameScaleSlider.fName = 'FrameScaleSlider';