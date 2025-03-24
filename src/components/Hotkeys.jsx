import { Fragment } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { get, use } from '../state';
import { flipDebugMode } from './RenderInfo';

export const hotkeysOptions = {
  enableOnTags: ['INPUT', 'SELECT', 'RADIO'],
  preventDefault: true,
};

// The hotkeys code is a bit old, I just moved it here to improve performance (it started being the only render trigger).
// Ideally I want to add hotkeys with more flexibility and without dependency arrays.
export function Hotkeys(props) {
  const { frameRef } = props;

  return <Fragment>
    <Hotkey keys="alt+r" updater={flipDebugMode}/>
    <Hotkey
      keys="alt+s"
      hook={() => [get.fileName, get.modifiedServerVersion, get.themeEditor.scopes, use.serverThemes()]}
      updater={(name, modified, scopes, [, {uploadTheme}]) => {
        if (name && name !== 'default' && modified) {
          uploadTheme(name, scopes);
        }
      }}
    />
    <Hotkey
      keys="alt+a"
      hook={use.frameClickBehavior}
      updater={(value, set) => {
        const newValue = value === 'alt' ? 'any' : 'alt';
        set(newValue);
        frameRef.current.contentDocument.documentElement.classList.toggle('force-cursor', newValue !== 'alt');
      }}
    />
  </Fragment>;
}

function Hotkey({keys, hook = () => [], updater = (value, set) => {}}) {
  const [...values] = hook();
  useHotkeys(
    keys,
    () => {
      updater(...values);
    },
    hotkeysOptions,
    [values]
  );
}
