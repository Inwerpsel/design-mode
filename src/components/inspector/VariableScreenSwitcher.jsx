import mediaQuery from 'css-mediaquery';
import React from 'react';
import { get, use } from '../../state';
import { mediaMatchOptions } from './VariableControl';

// Whether a variable is overridden by a later media query.
export const isOverridden = ({media, width, cssVar}) => {
  const {overridingMedia} = cssVar.allVar || cssVar;

  let found = !media;

  return !!overridingMedia && overridingMedia.some(({media, cssVar: queryVar})=> {
    if (found) {
      // The order should correspond to CSS order. So after we found the current var name it should start
      // checking if a later one overrides it.
      try {
        return mediaQuery.match(media, {width, ...mediaMatchOptions});
      } catch (e) {
        console.log('css-mediaquery could not handle query', media);
        return false;
      }
    }
    if (queryVar.name === cssVar.name) {
      found = true;
    }
    return false;
  });
};

function focus(element) {
  setTimeout(() => {
    element?.scrollIntoView({block: 'center'});
  }, 0);
}

export const VariableScreenSwitcher = props => {
  const {
    cssVar,
    media,
    element,
  } = props;
  const { screenOptions} = get;

  const [screenWidth, setWidth] = use.width();
  const [,setHeight] = use.height();

  const filteredOptions = screenOptions
    .filter(({ dims: [width] }) => {
      if (width === screenWidth) {
        return false;
      }
      if (media && !mediaQuery.match(media, {type: 'screen', width})) {
        return false;
      }

      // This var matches the screen, let's check if it's being overridden by another one.
      return !isOverridden({ media, width, cssVar });
    });

  return (
    <ul className={'variable-screen-switcher'}>
      {filteredOptions.map(({ label, dims: [width, height] }) => (
        <li key={label}>
          <button
            title={`Switch to ${label}`}
            onClick={(event) => {
              setWidth(width);
              setHeight(height);
              focus(element);
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <span
              className={'variable-screen-switcher-screen'}
              style={{
                width: `${width / 42}px`,
                height: `${height / 42}px`,
              }}
            />
          </button>
        </li>
      ))}
    </ul>
  );
};
