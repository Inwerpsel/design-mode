import React, {useMemo, useContext, Fragment} from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { use } from '../../state';
import {Checkbox} from '../controls/Checkbox';
import { SelectControl } from '../controls/SelectControl';
import { TextControl } from '../controls/TextControl';
import {AreasContext} from './MovablePanels';
import { Tutorial } from '../../_unstable/Tutorial';
import { MovableElementContext, useCompactSetting } from './MovableElement';
import { DragHandle } from './DragHandle';
import { doTransition } from '../../functions/viewTransition';
import { CompactModeButton } from './CompactModeButton';
import { presets } from './presets';
import { saveAsJsonFile } from '../../functions/export';

function Presets({setUiState, inputName, setInputName}) {
  return (
    <Fragment>
      <label htmlFor="">Presets: </label>
      <SelectControl
        value={inputName}
        options={[
          { label: '', value: '' },
          ...Object.entries(presets)
            .map(([name]) => ({
              label: name,
              value: name,
            })),
        ]}
        onChange={(name) => {
          setInputName(name);
          if (name === '') {
            return;
          }
          doTransition(() => {
            setUiState(presets[name]);
          });
        }}
      />
    </Fragment>
  );
}

export function MoveControls() {
  const {
    uiState, setUiState,
    resetPanels,
    dragEnabled, setDragEnabled,
    showMovers, setShowMovers,
    drawerOpen,
  } = useContext(AreasContext);

  const [isCompact] = useCompactSetting();

  const [windowArrangments, setWindowArrangments] = use.windowArrangments();

  const [inputName, setInputName] = useLocalStorage('panel-arrangements-name', '');
  const isIdenticalToExisting = useMemo(() => {
    return JSON.stringify(uiState) === windowArrangments[inputName];
  }, [windowArrangments, uiState, inputName]);

  // const supportsDrag = matchMedia('(pointer:fine)').matches;
  const supportsDrag = true;

  return (
    <div>
      <DragHandle />
      <Tutorial
        el={MoveControls}
        tasks={[
          () => [
            'Enable dragging elements',
            useContext(MovableElementContext).hostAreaId === 'area-right' ||
              dragEnabled,
          ],
          () => [
            'Move the element from the drawer to any other area',
            (useContext(MovableElementContext).hostAreaId || 'drawer') !==
              'drawer',
          ],
          () => ['Close the drawer', !drawerOpen],
        ]}
      >
        Turn on "drag elements" to drag any element to any area. "Move elements"
        is very broken atm.
      </Tutorial>
      {supportsDrag && (
        <Checkbox controls={[dragEnabled, setDragEnabled]}>
          Drag anything
        </Checkbox>
      )}
      <CompactModeButton />
      {!isCompact && (
        <Fragment>
          <Checkbox controls={[showMovers, setShowMovers]}>
            Long press
          </Checkbox>
          {Object.keys(uiState.map).length > 0 && (
            <button onClick={() => doTransition(() => resetPanels())}>
              reset
            </button>
          )}
          <div>
            <TextControl value={inputName} onChange={setInputName} />
            <button
              disabled={inputName.length === 0}
              onClick={() => {
                if (
                  inputName in windowArrangments &&
                  !confirm('Update arrangement?')
                ) {
                  return;
                }
                if (inputName.length === 0) {
                  return;
                }
                setWindowArrangments({
                  ...windowArrangments,
                  [inputName]: JSON.stringify(uiState),
                });
              }}
            >
              Save
            </button>
            <SelectControl
              value={isIdenticalToExisting ? inputName : ''}
              options={[
                { label: '', value: '' },
                ...Object.entries(windowArrangments)
                  // .filter(([name]) => !name.toLowerCase().includes('prod'))
                  .map(([name]) => ({
                    label: name,
                    value: name,
                  })),
              ]}
              onChange={(name) => {
                setInputName(name);
                if (name === '') {
                  return;
                }
                doTransition(() => {
                  setUiState(JSON.parse(windowArrangments[name]));
                });
              }}
            />
            {inputName.length > 0 && (
              <button
                onClick={() => {
                  saveAsJsonFile(uiState, inputName);
                }}
              >
                export
              </button>
            )}

            <Presets {...{ setUiState, inputName, setInputName }} />
          </div>
        </Fragment>
      )}
    </div>
  );
}

MoveControls.fName = 'MoveControls';