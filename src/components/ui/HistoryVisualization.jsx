import React, { useContext, useState, useEffect, useRef, Fragment } from 'react';
import { HistoryNavigateContext, addPin, historyBack, historyForward, interestingKeys, isInterestingState, latestOccurrence, pinInitial, pinLatest, performAction, removePin } from '../../hooks/useResumableReducer';
import { Checkbox, Checkbox2 } from '../controls/Checkbox';
import { get, use } from '../../state';
import { MovableElementContext } from '../movable/MovableElement';
import { setExcludedArea } from '../movable/Area';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ClearState, scrollHistory } from './HistoryControls';
import { Tutorial } from '../../_unstable/Tutorial';
import { icons } from '../../previewComponents';
import { ToggleButton } from '../controls/ToggleButton';

function DisableScrollHistoryInArea() {
    const {hostAreaId, homeAreaId} = useContext(MovableElementContext);
    const id = hostAreaId || homeAreaId;
    useEffect(() => {
      setExcludedArea(id);
    }, [id])
}

function getName(action) {
  return !action
    ? ''
    : typeof action.type === 'function'
    ? action.type.name
    : action.type;
}

// Is the current and next state a single action of the same type?
// This would allow a more compact display for multiple values going into the same place.
// First determine whether a particular action is being rendered in such a sequence.
// Then, pass this as a boolean into the preview components so they can render in a compact state.
// The challenge is some data in the payload needs to be taken into account.
// Particularly, themeEditor.set should only make it compact if next entry has same scope.
function nextHistoryEntryHasSameAction() {

}

const tasks = [
  () => {
    const { pins } = useContext(HistoryNavigateContext);
    return ['Pin the screen width and height.', pins.has('width') && pins.has('height')];
  },
];

function ExplainPins() {
  return <Fragment>
  <p>
    We're tracking so many things, that it's quite likely you'll not want to use the older
    version of certain things, but still want to wind back to any point in history for everything else.
  </p>
  <p>
    To achieve this, there is a pin button, which pins the value at a particular point in time,
    and so allows you to browse everything else.
  </p>
  <p>
    Note that pinning does not prevent you from making new changes to the same type of value (e.g. screen width).
    Rather, the new value will now be pinned instead. You can easily unpin this value again if needed.
  </p>
  </Fragment>;
}

// Quick fix to prevent dragging the history component, it often happens while toggling pins.
const interceptDrag = {
      draggable: true,
      onDragStart: e=>e.stopPropagation(),
};

function PinState(props) {
  const { id, historyIndex } = props;
  const { 
    pins,
    // historyOffset,
    // past,
  } = useContext(HistoryNavigateContext);
  const pinIndex = pins.get(id);
  const pinnedHere = historyIndex === pinIndex;

  // const pinnedInFuture = pinIndex > (past.length - historyOffset);

  return <Fragment>
    <button
      {...interceptDrag}
      className={pinnedHere ? 'pinned-here' : ''}
      style={{
        outline: pinnedHere ? '2px solid black' : 'none',
        background: pinnedHere ? 'white' : 'transparent',
      }}
      onClick={(event) => {
        pinnedHere ? removePin(id) : addPin(id, historyIndex);
        event.stopPropagation();
      }}
      // title="Pin here"
    >
      <span className='pin'>📌</span>
    </button>
    {/* {pinnedHere && !pinnedInFuture && <ClearState {...{id}} />} */}
  </Fragment>;
}

function PinLatest(props) {
  const { id  } = props;
  const { pins } = useContext(HistoryNavigateContext);
  const latestForId = latestOccurrence(id);

  const pinIndex = pins.get(id);
  const pinnedAtLatest = pinIndex === latestForId;

  return (
    <button
      {...interceptDrag}
      className={pinnedAtLatest ? 'pinned-latest' : 'pin-latest'}
      style={{
        float: 'right',
        outline: pinnedAtLatest ? '2px solid black' : 'none',
        background: pinnedAtLatest ? 'white' : 'transparent',
      }}
      onClick={
        pinnedAtLatest
          ? () => {
              removePin(id);
            }
          : () => {
              pinLatest(id);
            }
      }
      title='Pin to latest'
    >
      <span className='pin'>📌</span>→
    </button>
  );
}

function PinFirst(props) {
  const { id, historyIndex  } = props;
  const { pins } = useContext(HistoryNavigateContext);
  if (historyIndex === 0) {
    return null;
  }
  const pinnedIndex = pins.get(id);
  const pinnedInitial = pinnedIndex === 0;

  return (
    <button
      {...interceptDrag}
      className={pinnedInitial ? 'pinned-initial' : ''}
      style={{
        float: 'right',
        outline: pinnedInitial ? '2px solid black' : 'none',
        background: pinnedInitial ? 'white' : 'transparent',
        // visibility: pinnedAtLatest ? 'visible' : null,
      }}
      onClick={
        pinnedInitial
          ? () => {
              removePin(id);
            }
          : () => {
              pinInitial(id);
            }
      }
      title='Pin to initial'
    >
      ←<span className='pin'>📌</span>
    </button>
  );
}

function MoreCommands({id}) {
  const [open, setOpen] = useState(false);

  return (
    <div {...interceptDrag} style={{position: 'relative'}}>
      <ToggleButton controls={[open, setOpen]}>...</ToggleButton>
      {open && <div style={{position: 'absolute', top: '100%'}}>
        <ClearState {...{id}}/>
        </div>}
    </div>
  );
}

function ActionList(props) {
  const {showScrolls} = get;
  const {actions, showPayloads, historyIndex} = props;
  const {
      previewComponents,
      pins,
  } = useContext(HistoryNavigateContext);

  return (
    <ul className='history-actions'>
      {[...actions].map(([id, action], key) => {
        if (!showScrolls && id.startsWith('areaOffset')) return;

        const isObject = typeof action === 'object';
        if (action === null) {
          return <span style={{color: 'red'}}>IT IS NULL</span>
        }
        const isFromReducer = isObject && 'type' in action;
        const value = isFromReducer
          ? JSON.stringify(action.payload, null, 2)
          : isObject
          ? JSON.stringify(action, null, 2)
          : action;

        const name = !isFromReducer ? '' : '::' + getName(action);
        const isPayloadLess = value === '{}';
        const isShortString = !isFromReducer && (typeof value === 'boolean' || typeof value === 'number' || value?.length < 320);

        const previews = previewComponents[id];
        const Preview =
          typeof previews === 'function'
            ? previews
            : !(id in previewComponents)
            ? null
            : previewComponents[id][getName(action)];

        const isPinned = pins.has(id);
        const isPinnedElsewhere =  isPinned && pins.get(id) !== historyIndex;

        const icon = icons[id] || '';

        return (
          <li
            key={`${historyIndex}:${key}`}
            title={isPinnedElsewhere ? 'Overridden by pin' : ''}
            style={{ clear: 'both', opacity: isPinnedElsewhere ? 0.5 : 1 }}
          >
            <PinState {...{ id, historyIndex }} />
            <PinLatest {...{ id, historyIndex }} />
            <PinFirst {...{ id, historyIndex }} />
            {isPinned && (
              <span style={{ float: 'right' }}>
                <MoreCommands {...{ id }} />
              </span>
            )}
            {icon}
            {!Preview && (
              <span>
                <b>{id.substring(0, 128)}</b>
                {name}
              </span>
            )}

            {!Preview && isShortString && (
              <pre
                style={{ margin: 0, float: 'right' }}
                className="monospace-code"
              >
                {value === false ? 'off' : value === true ? 'on' : value}
              </pre>
            )}
            {!isPayloadLess && showPayloads && (
              <pre className="monospace-code">
                {value === false ? 'false' : value === true ? 'true' : value}
              </pre>
            )}
            {Preview && (
              <Preview {...{ action, historyIndex }} payload={action.payload} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

const tutorial = (
  <Tutorial el={HistoryVisualization} {...{ tasks }}>
    <ExplainPins />
    Since history visualization is disabled, this only shows current history
    entry.
  </Tutorial>
);

function CurrentActions() {
  const {
    past,
    historyOffset,
    lastActions,
    initialStates,
  } = useContext(HistoryNavigateContext);
  const [showInitial, setShowInitial] = useState(false);
  const index = past.length - historyOffset;
  const isLatest = historyOffset === 0;
  const actions =  isLatest ? lastActions : past[index].lastActions;
  const isInitial = index === 0; 
  const entries =  (isInitial && showInitial)
    ? [...initialStates.entries()].filter(([id]) => id in use) 
    : [...actions.entries()];
  
  return (
    <div className='history-current' onWheelCapture={scrollHistory} style={{minWidth: '280px', maxWidth: '400px', minHeight: '200px', overflow: 'hidden visible'}}>
      {tutorial}
      {isInitial && <Checkbox controls={[showInitial, setShowInitial]} >Show all initial values</Checkbox>}
      <ActionList historyIndex={index} actions={entries} />
      {/* Quick fix for el not always shown... */}
    </div>
  ); 
}

export function HistoryVisualization() {
  const [visualizeAlways, setVisualizeAlways] = use.visualizeHistoryAlways();
  const [debug, setDebug] = useState(false);
  const [showAll, setShowAll] = useLocalStorage('showAllHistory', true);
  const [window, setWindow] = useLocalStorage('windowHistory', false);
  const [showJson, setShowJson] = useState(false);
  const [showPayloads, setShowPayloads] = useState(false);
  const {
    past,
    historyOffset,
    lastActions,
    pointedStates,
    pins,
  } = useContext(HistoryNavigateContext);

  const showHistory = get.visualizeHistory && (visualizeAlways || historyOffset !== 0);

  let currentRef = useRef();

  useEffect(() => {
    currentRef.current?.scrollIntoView({block: 'center'});
  }, [historyOffset]);

  if (!showHistory) {
    return <CurrentActions />;
  }

  const currentIndex = past.length - historyOffset;
  let isInFuture = false;

  return (
    <div className="history">
      <Tutorial el={HistoryVisualization} {...{tasks}}>
        <ExplainPins />
        See all steps you took here.
      </Tutorial>
      <DisableScrollHistoryInArea/>
      <Checkbox controls={[showAll, setShowAll]}>Show all</Checkbox>
      <Checkbox2 hook={use.showScrolls}>Include scroll position</Checkbox2>
      <Checkbox controls={[debug, setDebug]}>Debug</Checkbox>
      <Checkbox controls={[window, setWindow]}>
        window
      </Checkbox>

      {debug && <div>
        <Checkbox controls={[showJson, setShowJson]}>
          Inspect current state
        </Checkbox>
        <Checkbox controls={[showPayloads, setShowPayloads]}>
          Show payloads
        </Checkbox>
        <button onClick={() => console.log(pointedStates)}>console.log</button>
        {showJson && (
          <pre className="monospace-code">
            {JSON.stringify(Object.fromEntries(pointedStates), null, 2)}
          </pre>
        )}
      </div>}

      <ul className='connected-list'>
        {past.map(({ states, lastActions }, index) => {
          const isPresent = index === currentIndex;
          // We don't use this in the present so it can be true already.
          isInFuture = isInFuture || isPresent;
          const amount = Math.abs(index - currentIndex);
          if (window && amount > 10) {
            return null;
          }

          // Check if simple state would be changed by replaying.
          // Reducer actions are assumed to always be able to change state.
          const canReplay = [...lastActions.entries()].some(
            ([id, action]) =>
              typeof action === 'object' || states.get(id) !== pointedStates.get(id)
          );

          if (!isPresent && !showAll && index !== 0 && amount !== 1 && !isInterestingState(lastActions, index)) {
            // Always display an entry if state is pinned to its index
            const keys = [...lastActions.keys()];
            const anyPinnedHere = keys.some(id=>pins.has(id) && pins.get(id) === index);
            if (!anyPinnedHere && !keys.some(k=>interestingKeys.includes(k))) {
              return null;
            }
          }

          return (
            <li
              key={index}
              id={isPresent ? 'history-current-state' : ''}
              ref={index === currentIndex ? currentRef : null}
              style={{
                position: 'relative',
                outline:
                  index === currentIndex
                    ? '3px solid black'
                    : 'none',
              }}
            >
              <span style={{marginLeft: '-32px'}}>
                { index }
              </span>
              <ActionList
                historyIndex={index}
                actions={[...lastActions.entries()]}
                {...{ showPayloads }}
              />
              <div
                className='history-state-buttons'
                style={{
                  display: 'flex',
                  justifyContent: 'stretch',
                }}
              >
                <button
                  style={{width: '50%'}}
                  onClick={
                    isPresent
                      ? () => {
                        // Ensure history doesn't collapse.
                          setVisualizeAlways(true);
                          historyForward(historyOffset);
                        }
                      : isInFuture 
                        ? () => {historyForward(amount)} 
                        : () => {historyBack(amount)}
                  }
                >
                  {isPresent ? 'jump to end' : 'jump here'}
                </button>
                {canReplay && (
                  <button
                    style={{width: '50%'}}
                    onClick={(event) => {
                      for (const [id, action] of lastActions.entries()) {
                        performAction(id, action);
                      }
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    do again
                  </button>
                )}
              </div>
            </li>
          );
        })}
        <li
          onClick={!isInFuture ? null : () => {
            historyForward(historyOffset);
          }}
          key={'latest'}
          style={{
            outline:
              historyOffset === 0 ? '3px solid black' : 'none',
          }}
        >
          <span style={{marginLeft: '-32px'}}>
            Latest
          </span>
          <ActionList
            historyIndex={past.length}
            actions={[...lastActions.entries()]}
            {...{ showPayloads }}
          />
        </li>
      </ul>
    </div>
  );
}

HistoryVisualization.fName = 'HistoryVisualization';