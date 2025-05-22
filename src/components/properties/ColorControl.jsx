import {
  SketchPicker,
  ChromePicker,
  SliderPicker,
  GooglePicker,
} from 'react-color';
import { ACTIONS, editTheme } from '../../hooks/useThemeEditor';
import React, { Fragment } from 'react';
import { ThemePalettePicker } from '../ThemePalettePicker';
import { useThrottler } from '../../hooks/useThrottler';
import { TextControl } from '../controls/TextControl';
import { CreateAlias } from '../inspector/CreateAlias';
import { get } from '../../state';
import { SelectControl } from '../controls/SelectControl';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { OklchColorControl, toOk } from './OklchColorControl';

import { converter, clampGamut, formatHsl, formatHex } from 'culori';

export const COLOR_VALUE_REGEX = /(#[\da-fA-F]{3}|rgba?\()|oklch\(/;
export const GRADIENT_REGEX = /(linear|radial|conic)-gradient\(.+\)/;

const INTERNAL_VARS_REGEX = /^(--var-control|--server-theme|--theme-editor)/;

export const PREVIEW_SIZE = '39px';

export const pickFormat = (color, opacity) =>
  opacity === 1
    ? formatHex(color)
    : `rgb(${color.r},${color.g},${color.b},${opacity})`;

const extractUsage = (colors , [name, color]) => {
  if (/px/.test(color)) {
    return colors;
  }
  if (COLOR_VALUE_REGEX.test(color) || GRADIENT_REGEX.test(color)) {
    if (!(color in colors)) {
      colors[color] = {color, usages: [], isGradient: GRADIENT_REGEX.test(color)};
    }
    colors[color].usages.push(name);
  }

  return colors;
};

export const extractColorUsages = (theme, defaultValues) => {
  if (null === theme) {
    return [];
  }
  const combined = {
    ...defaultValues,
    ...theme,
  };

  return Object.values(
    Object.entries(combined).filter(([k]) => !INTERNAL_VARS_REGEX.test(k)).reduce(extractUsage, {})
  );
};

export const byOklchParams = ({ color: color1 }, { color: color2 }) => {
  const a = toOk(color1);
  const b = toOk(color2);

  if (!a) return -1;
  if (!b) return 1;

  if (a.l > b.l) return 1;

  if (a.l < b.l) return -1;

  if (a.h > b.h) return 1;
  if (a.h > b.h) return -1;

  return a.c - b.c;
};

const pickerSize = '80px';

const pickers = {
  sketch: SketchPicker,
  chrome: ChromePicker,
  slider: SliderPicker,
  google: GooglePicker,
};

const pickerOptions = Object.keys(pickers).map(k => ({label: k, value: k}))

const toRgb = converter('rgb');
const toHsl = converter('hsl');

export function toHslParams(colorString) {
  const hsl = toHsl(clampGamut('hsl')(colorString));

  return `${hsl.h},${(hsl.s * 100)}%,${(hsl.l * 100)}%`;
}

export const ColorControl = (props) => {
  const { onChange: _onChange, value: origValue, resolvedValue, cssVar, cssFunc } = props;
  const {name, usages} = cssVar;
  const { nativeColorPicker } = get;
  const dispatch = editTheme();

  const isHslParams = cssFunc === 'hsl' || cssFunc === 'hsla';
  const onChange = isHslParams ? (v => _onChange(toHslParams(v))) : _onChange;
  const value = isHslParams ? `hsl(${resolvedValue})` : resolvedValue;
  const parsed = toRgb(clampGamut('hsl')(value)) || {};


  const throttle = useThrottler({ ms: 20 });
  const opacity = parsed.alpha || 1;

  // Disallow gradients if not all usages support it.
  const allowGradients = !usages.some(({property}) => property !== 'background');

  const hslValue = formatHsl(parsed);
  const hex = formatHex(parsed);

  const [variant, setVariant] = useLocalStorage('color-picker-variant', 'chrome');
  const ColorPicker = pickers[variant];
  const [useOk, setUseOk] = useLocalStorage('ok-picker', false);

  if (!nativeColorPicker) {
    return (
      <Fragment>
        {useOk && <OklchColorControl {...{value, onChange }}/>}
        <div style={{ display: 'flex', clear: 'both' }}>
          <CreateAlias key={value} {...{ value, origValue }} />
          <div style={{display: 'flex'}}>
            <button style={{borderTopRightRadius: 0, borderBottomRightRadius: 0, marginRight: 0, borderRight: 'none'}} onClick={()=>setUseOk(false)} disabled={!useOk}>rgb/hsl</button>
            <button style={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0}} onClick={()=>setUseOk(true)} disabled={useOk}>oklch</button>
          </div>
        </div>
        {!useOk && (
          <Fragment>
            <ColorPicker
              // Apparently the Google picker comes with a header text baked in.
              // This will show above the actual picker.
              // You can only make the content empty, and not prevent it from rendering it. Sigh...
              header=''
              width='100%'
              styles={{
                picker: {
                  width: '100%',
                },
              }}
              color={hslValue}
              onChange={(color) => {
                const hasTransparency = color.rgb.a !== 1;

                const { r, g, b, a } = color.rgb;

                // Component throttles internally, adding it here too makes it unresponsive.
                onChange(
                  hasTransparency ? `rgba(${r} , ${g}, ${b}, ${a})` : color.hex
                );
              }}
            />
            <div>
              <TextControl
                style={{ marginTop: '6px' }}
                value={value}
                onChange={(value) => onChange(value, true)}
              />
              <button
                onClick={() => {
                  value === 'transparent'
                    ? dispatch({ type: ACTIONS.unset, payload: { name } })
                    : onChange('transparent');
                }}
                style={{
                  fontSize: '12px',
                  opacity: value === 'transparent' ? 1 : 0.4,
                }}
              >
                👻
              </button>
            <SelectControl title='Change color picker style' style={{float: 'right'}} options={pickerOptions} value={variant} onChange={setVariant}/>
            </div>
            
          </Fragment>
        )}
        <ThemePalettePicker {...{ value, onChange, name, allowGradients }} />
      </Fragment>
    );
  }

  return (
    <div style={{ minHeight: '120px', clear: 'both' }}>
      <CreateAlias key={value} {...{ value, origValue }} />
      <input
        type="color"
        style={{
          width: pickerSize,
          height: pickerSize,
          float: 'right',
          opacity,
        }}
        value={hex}
        onChange={(event) => {
          const color = toRgb(event.target.value);
          const newColor = pickFormat(color, opacity);

          // Native picker emits values much more frequently than can be distinguished when applied.
          // Since most editor components re-render on changes to the theme, we apply a modest amount
          // of throttling.
          throttle(onChange, newColor);
        }}
      />
      <input
        type="number"
        style={{
          float: 'right',
        }}
        min={0}
        max={1}
        step={.05}
        value={parsed.a}
        onChange={(event) => {
          const opacity = Number(event.target.value);
          const newColor = pickFormat(parsed, opacity);

          onChange(newColor);
        }}
      />
      <button
        onClick={() => {
          value === 'transparent'
            ? dispatch({ type: ACTIONS.unset, payload: { name } })
            : onChange('transparent');
        }}
        style={{
          fontSize: '12px',
          float: 'right',
          width: PREVIEW_SIZE,
          opacity: value === 'transparent' ? 1 : .4,
        }}
      >
        👻
      </button>
      <div style={{ clear: 'both' }}>
        <ThemePalettePicker {...{ value, onChange, name, allowGradients }} />
      </div>
    </div>
  );
};
