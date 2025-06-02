import { Fragment, useContext, useEffect, useState } from "react";
import { getCurrentOffset, goToStart, historyForward, historyForwardOne, HistoryNavigateContext } from "../../hooks/useResumableReducer";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Checkbox } from "../controls/Checkbox";
import { get } from "../../state";
import { useGlobalState } from "../../hooks/useGlobalState";
import { doTransition, viewTransitionsEnabled } from "../../functions/viewTransition";

function CountTimeInState({ms}) {
  if (ms < 3999) {
    // This timer doesn't make sense for very short amounts.
    return;
  }
  const { historyOffset } = useContext(HistoryNavigateContext);

  const length = Math.round(ms / 1000) - 1;

  return (
    <span
      key={historyOffset}
      style={{ '--countdown-length': length }}
      className="countdown"
    />
  );
}

export function Play() {
  const { playTime } = get;
  const [on, setOn] = useGlobalState('playing', false);
  const [loop, setLoop] = useState(false);
  const [_ms, setMs] = useLocalStorage('replayMs', 1000);

  const ms = playTime > 0 ? playTime * 1000 : _ms;

  const transitionsEnabled = viewTransitionsEnabled();

  useEffect(() => {
    if (on) {
        let interval;
        interval = setInterval(() => {
            if (getCurrentOffset() === 0) {
                if (loop) {
                    goToStart();
                } else {
                    setOn(false);
                    clearInterval(interval);
                }
            } else {
                doTransition(() => {
                  historyForward(1, true);
                });
            }
        }, ms);
        let docClickListener;
        if (viewTransitionsEnabled) {
          docClickListener = document.addEventListener('click', e => {
            if (e.composedPath()[0] === document.documentElement) {
              setOn(false);
            }
          })
        }
        return () => {
            clearInterval(interval);
            if (viewTransitionsEnabled) {
              document.removeEventListener('click', docClickListener);
            }
        };
    }
  }, [on, loop, ms]);

  const blockPlay = !on && transitionsEnabled && (ms < 600);

  return (
    <div>
      <input style={{minWidth: '7rem', maxWidth: '7rem'}} type="number" value={_ms} onChange={(e) => setMs(e.target.value)} />
      <Checkbox controls={[loop, setLoop]}>loop</Checkbox>
      <button onClick={goToStart}>⏮</button>
      <button
        // Refuse too short view transitions as they prevent clicking the pause button.
        disabled={blockPlay}
        title={!blockPlay ? null : 'View transitions require at least 600ms of play time.'}
        onClick={() => {
          setOn(!on);
        }}
      >
        {on ? '⏸' : '▶'}
      </button>
      {on && <CountTimeInState {...{ms}}/>}
    </div>
  );
}

Play.fName = 'Play';