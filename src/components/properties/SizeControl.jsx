import React, {useState} from 'react';
import { TextControl } from '../controls/TextControl';
import { CalcSizeControl, isSingleMathExpression } from './CalcSizeControl';

export const sizeLikeProperties = [
  'font-size',
  'border',
  'border-width',
  'border-bottom',
  'border-bottom-width',
  'line-height',
  'border-radius',
  'margin',
  'margin-bottom',
  'margin-top',
  'margin-left',
  'margin-right',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'padding-block-start',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'letter-spacing',
  'outline-offset',
  'top',
  'bottom',
  'left',
  'right',
  'outline-width',
  'outline-offset',
  'gap',
  'block-size',
  'inline-size',
  'max-inline-size',
  'min-inline-size',
  'scroll-padding-top',
  'scroll-margin-top',
];

const remSize = 16;

const convertRemToPixels = (rem) => rem * remSize;
const convertPixelsToRem = (px) => px / remSize;

const isPx = value => value && value.match(/[\d.]+px$/);
const isRem = value => value && value.match(/[\d.]+rem$/);
const isPercent = value => value && value.match(/\d%$/);
const isVh = value => value && value.match(/vh$/);
const isVw = value => value && value.match(/vw$/);

export const SizeControl = props => {
  const {onChange, value: _value, resolvedValue: value} = props;
  const [step, setStep] = useState(.1);

  const pxValue = isPx(value) ? value.replace('px', '') : isRem(value) ? convertRemToPixels(parseFloat(value.replace('rem', ''))) : '';
  const remValue = isRem(value) ? value.replace('rem', '') : isPx(value) ? convertPixelsToRem(parseFloat(value.replace('px', ''))) : '';

  if (isSingleMathExpression(value)) {
    return <CalcSizeControl {...props}/>;
  }

  return <div className='theme-length-controls'>
    <div className={'theme-length-control control-px'} style={{clear: 'both'}}>
      <input
        type={ 'number' }
        value={pxValue}
        onChange={ event => {
          onChange(`${ event.currentTarget.value }px`);
        } }
      />
      <span>px</span>
    </div>
    <div className={'theme-length-control control-rem'}  >
      <input
        step={.1}
        type={ 'number' }
        value={remValue}
        onChange={ event => {
          onChange(`${ event.currentTarget.value }rem`);
        } }
      />
      <span>rem</span>
    </div>
    <div className={'theme-length-control control-pct'}>
      <input
        type={ 'number' }
        value={ isPercent(value) ? value.replace('%', '') : ''}
        onChange={ event => {
          onChange(`${ event.currentTarget.value }%`);
        } }
      />
      <span>%</span>
    </div>
    <div className={'theme-length-control control-vh'}>
      <input
        type={ 'number' }
        value={ isVh(value) ? value.replace('vh', '') : ''}
        onChange={ event => {
          onChange(`${ event.currentTarget.value }vh`);
        } }
      />
      <span>vh</span>
    </div>
    <div className={'theme-length-control control-vw'}>
      <input
        type={ 'number' }
        value={ isVw(value) ? value.replace('vw', '') : ''}
        onChange={ event => {
          onChange(`${ event.currentTarget.value }vw`);
        } }
      />
      <span>vw</span>
    </div>
    <div className={'theme-length-control control-no-unit'}>
      <input
        {...{step}}
        type={ 'number' }
        value={ /(^\d+(\.\d*)?$|^\.\d+$)/.test(value) ? value : ''}
        onChange={ event => {
          onChange(event.currentTarget.value);
        } }
      />
      <span>[no unit]</span>
      <input
        type={ 'number' }
        value={ step }
        style={{fontSize: '10px'}}
        onChange={ event => {
          setStep(event.currentTarget.value);
        } }
      />
      step
    </div>
    <button
      disabled={value === 0 || value === '0'}
      onClick={() => {
        onChange('0');
      }}
    >0
    </button>
    <button onClick={() => {
      onChange(`calc(${_value})`);
    }}>Calculate</button>
    <TextControl
      value={ _value }
      onChange={ onChange }
    />
  </div>;
};
