import { useInsertionEffect, useLayoutEffect, useRef } from 'react';
import { use } from '../../state';

let latest;
export function PickedValue() {
  const ref = useRef();
  const [v, setV] = use.pickedValue();
  const empty = v === '';
  if (!empty) {
    latest = v;
  }

  const value = empty ? latest : v;

  useInsertionEffect(() => {
    const style = ref.current?.style;
    if (!style) return;
    console.log(value, style.backgroundImage, style.backgroundColor);
    if (style.backgroundImage !== value) {
      style.removeProperty('background-image');
      // In case the value we read back is different due to parsing but successfully set,
      // setting it again should bring it in the right state.
      // If the value was in fact invalid, setting it again does nothing.
      // So far, looks like it's really cheap as long as the property is not inherited.
      style.setProperty('background-image', value);
    }
    if (style.backgroundColor !== value) {
      style.removeProperty('background-color');
      style.setProperty('background-color', value);
    }
  }, [v]);

  if (empty && !latest) return null;

  return (
    <div>
      {/* <button disabled={empty} onClick={() => {setV('')}}>drop</button> */}
        <button
          ref={ref}
          onClick={() => {
            setV(empty ? latest : '');
          }}
          style={{
            maxWidth: 220,
            backgroundImage: value,
            backgroundColor: value,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            height: empty ? 32 : 64,
            textShadow: 'white 0px 10px',
          }}
        >
          {value.length < 64 ? value : value.substring(0, 60)}
        </button>
    </div>
  );
}

PickedValue.fName = 'PickedValue';