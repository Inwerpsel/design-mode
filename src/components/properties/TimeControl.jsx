import React, {useState} from 'react';
import { SelectControl } from '../controls/SelectControl';
import {valuesAsLabels} from '../inspector/TypedControl';

export const timeLikeProperties = [
  'transition-duration',
  'animation-delay',
];

const timingSteps = ['1', '10', '100'];

const shortCuts = ['0', '1', '100', '1000', '2000', '3000'];

export const TimeControl = props => {
  const [step, setStep] = useState('100');
  const {value, onChange} = props;

  const number = value.replace(/\D+/g, '');

  return <div className=''>
    <input
      {...{step}}
      type={ 'number' }
      value={number}
      onChange={ event => {
        onChange(`${ event.currentTarget.value }ms`);
      } }
    />
    <span>ms</span>
    <SelectControl
      style={{display: 'inline'}}
      options={timingSteps.map(valuesAsLabels)}
      value={ step }
      onChange={ value => {
        setStep(value);
      } }
    />step
    {shortCuts.map(value => <button
      key={value}
      disabled={number === value}
      onClick={() => {
        onChange(`${value}ms`);
      }}
    >
      {value}
    </button>)}
  </div>;
};
