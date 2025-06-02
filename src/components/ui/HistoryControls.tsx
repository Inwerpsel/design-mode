import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import {
  HistoryNavigateContext,
  addPin,
  clearHistory,
  clearState,
  historyBack,
  historyBackFast,
  historyBackOne,
  historyForward,
  historyForwardFast,
  historyForwardOne,
  historyGo,
  removePin,
} from '../../hooks/useResumableReducer';
import { Checkbox } from '../controls/Checkbox';
import { use } from '../../state';
import { Tutorial } from '../../_unstable/Tutorial';
import { icons } from '../../previewComponents';
import { doTransition } from '../../functions/viewTransition';

function HistoryBack() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    // This and the next view transition are added here because it's a relatively safe place to showcase it,
    // while not being too affected by its major drawbacks.
    // Still, it causes the button to become unresponsive to clicks during the transition,
    // and even results in a text selection being made of the component that it would otherwise never do when
    // clicking on a button element.
    // All of this happens even if the button does not move during the transition.
    // So this uses a view transition mostly because it's a very clear demonstration of these drawbacks,
    // and the other history UI makes it so you don't realy need these buttons anyway.
    onClick={() => doTransition(() => historyBackOne())}
  >←
  </button>;
}

function HistoryForward() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={() => doTransition(() => historyForwardOne())}
  >→
  </button>;
}

function HistoryBackFast() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);
  const remainingLength = past.length - historyOffset;
  const noHistory = remainingLength < 1;

  return <button
    className={'history-button'}
    disabled={noHistory}
    title={noHistory ? 'No history' : remainingLength}
    onClick={historyBackFast}
  >!←
  </button>;
}

function HistoryForwardFast() {
  const { historyOffset } = useContext(HistoryNavigateContext);

  const noFuture = historyOffset === 0;

  return <button
    className={'history-button'}
    disabled={noFuture}
    title={noFuture ? 'No future' : historyOffset}
    onClick={historyForwardFast}
  >→!
  </button>;
}

function Dots({amount}) {
  const dots = [];
  for (let i = 0; i < amount; i++) {
    dots.push(i);
  }

  const skipDrag = amount > 60;

  return <div style={{position: 'absolute', top: '4px', left: '2.4px', width: 'calc(100% - 7px)', display: 'flex', justifyContent: 'space-between'}}>
    {dots.map(i => <span onDragEnter={skipDrag ? null : () => {
      historyGo(amount - i - 1);
    }} key={i} style={{height: '6px', borderLeft: '1px solid #646262'}}/>)}
  </div>
}

const tutorial = (
  <Tutorial el={MiniTimeline}>
    Here's a compact version of the history timeline. You can scroll above the
    history section to move the timeline one step at a time, however fast you
    and your mouse like to work with.
    <h1>Warning!</h1>
    <p>
      This will restore the UI state across the whole screen, which definitely
      is a concern for people with epilepsy.
    </p>
    <p>
      After having changed the page background color multiple times, for
      example, going through this history timeline fast will cause the whole
      preview screen to flash.
    </p>
    <p>
      It's recommended to only use it when controlled, small nudges of the wheel
      are possible.
    </p>
    <p>
      Keeping some state pinned can help reduce the amount of changes happening
      in rapid succession.
    </p>
  </Tutorial>
);

function scrollToPoint(length, event: MouseEvent) {
  const target = event.currentTarget.closest('minitimeline') || event.currentTarget;
  const rect = target.getBoundingClientRect();
  const ratio = Math.max(0, (event.clientX - rect.left) / rect.width);
  const newIndex = Math.round(length * ratio);
  historyGo(length - newIndex);
}
function scrollWhileDragging(length, ref, event) {
  // Checking for hover as a simple way to exclude a swipe from the top on touch screens.
  if (event.pressure > 0.01 && ref.current?.matches(':hover, :active')) {
    scrollToPoint(length, event);
  }
}

export function MiniTimeline() {
  const { past, historyOffset } = useContext(HistoryNavigateContext);

  const percentage = past.length === 0 ? 0 : 100 - (100 * historyOffset / past.length);
  const ref = useRef(null);

  return (
    <div
      {...{ref}}
      className='minitimeline'
      onPointerMove={scrollWhileDragging.bind(null, past.length, ref)}
      onClick={scrollToPoint.bind(null, past.length)}
      style={{
        width: '100%',
        height: '8px',
        padding: '2px',
        background: 'darkgrey',
        boxSizing: 'border-box',
        userSelect: 'none',
        touchAction: 'none', // Without this the drag is interrupted after some distance.
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '6px',
          background: 'rgb(26, 217, 210)',
          borderRight: '3px solid black',
          transition: 'width .06s ease-out',
          boxSizing: 'border-box',
        }}
      ></div>
      {past.length < 200 && <Dots amount={past.length + 1} />}
      {tutorial}
    </div>
  );
}

export function ClearState({id}) {
  if (id === 'themeEditor') return;

  return <button title={'Clear all other values and move this one to start'} onClick={clearState.bind(null, id)}>Clear others</button>
}

export function ActivePins() {
  const { pins } = useContext(HistoryNavigateContext);

  const [open, setOpen] = useState(false);

  const amount = pins.size;

  // if (amount === 0) {
  //   return null;
  // }

  return (
    <Fragment>
      <button
        title={open ? '' : [...pins.keys()].join(', ')} 
        onClick={(event) => {
          setOpen(!open);
        }}
      >
        <span style={{filter: amount === 0 ? 'grayscale(1)' :  'none'}}>
        📌{amount}
        </span>
      <Tutorial el={ActivePins}>
        <p>
          This button shows how many pins are applied and allows you to toggle each.
        </p>
        <p>
          Notice how the timeline now jumps over the entries we pinned earlier.
        </p>
      </Tutorial>
      </button>
      {open && <PinList close={() => setOpen(false)}/>}
    </Fragment>
  );
}

function PinList({close}) {
  const { pins, past, historyOffset, states } = useContext(HistoryNavigateContext);
  // Keep original pins so that you can toggle them on and off while the menu is shown.
  const [origPins] = useState(new Map(pins));
  const entries = [...origPins.entries()];
  const ref = useRef();
  let i = 0;

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current.parentNode.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('click', listener);
    return () => {
      document.removeEventListener('click', listener);
    };
  }, [])

  return (
    <ul
      {...{ref}}
      style={{
        zIndex: 100,
        position: 'absolute',
        background: 'white',
        border: '1px solid black',
      }}
    >
      {entries.map(([key, index]) => {
        const active = pins.has(key);
        const enable = () => addPin(key, index);
        const disable = () => removePin(key);
        const entry = index < past.length ? past[index].states : states;
        const value = entry.has(key) ? entry.get(key) : 'default';
        i++;
        const targetOffset = past.length - index;

        return (
          <li {...{ key, style: {listStyleType: 'none', opacity: active ? 1 : .7} }}>
            <button className={active ? 'pinned-here' : ''} style={{fontSize: '18px',background: active ? '' : 'transparent'}} autoFocus={i === 1} onClick={active ? disable : enable}>
              <span className='pin'>📌</span>
            </button>
            {icons[key] || ''} {key}: { typeof value === 'object' ? '[obj]' : value}
            <ClearState {...{id: key}} />
            {targetOffset !== historyOffset && <button title={targetOffset} onClick={(event) => {
              historyGo(targetOffset);
              // Keep lock menu open.
              event.stopPropagation();
            }}>visit</button>}
          </li>
        );
      })}
    </ul>
  );
}

function OriginalUrl() {
  const { historyUrl } = useContext(HistoryNavigateContext);

  const currentUrl = window.location.href;
 
  if (!historyUrl || (historyUrl === currentUrl)) {
    return;
  }

  return <a href={historyUrl}>{historyUrl.replace(/http:\/\/|https:\/\//, '')}</a>
}

// let lastScroll = 0;

export function scrollHistory(event) {
  // Quick fix to prevent confusing mayham when all elements are in the drawer.
  if (event.target.closest('#drawer')) return;
  // const now = performance.now();
  const delta = Math.round(event.deltaY / 100);
  // const navigate = () => {
    delta > 0 ? historyBack(delta, true) : historyForward(-delta, true);
  // };
  // if (now - lastScroll > 300 && Math.abs(delta) === 1) {
    // doTransition(navigate);
  // } else {
  //   navigate();
  // }
  // lastScroll = now;
}

export function HistoryControls() { 
    const [visualize, setVissualize] = use.visualizeHistory();
    const [visualizeAlways, setVissualizeAlways] = use.visualizeHistoryAlways();

    return (
      <div onWheelCapture={scrollHistory}>
        <MiniTimeline />
        <ActivePins />
        <Checkbox controls={[visualize, setVissualize]}>Visualize</Checkbox>
        {visualize && <Checkbox title='Always or only when in a previous state' controls={[visualizeAlways, setVissualizeAlways]}>Always</Checkbox>}

        <button
          onClick={() => {
            confirm('Clear all history, keeping only current state?') && clearHistory();
          }}
        >
          Clear
        </button>
        <div style={{display: 'inline-flex'}}>
          <HistoryBackFast />
          <HistoryBack />
          <HistoryForward />
          <HistoryForwardFast />
        </div>
        <Tutorial el={HistoryControls}>
          <p>
            Every step you do in the editor is tracked in a history timeline.
            Keyboard shortcuts (control+z and others) work like anywhere else.
          </p>

          <p>
            On top of "normal" history buttons, there's the fast buttons (!← and →!),
            that jump to the most important steps like edits to style rules,
            newly inspected elements, and editor UI layout changes. It jumps
            over the less interesting steps, while still applying their result.
          </p>
        </Tutorial>
      </div>
    );
}

HistoryControls.fName = 'HistoryControls';