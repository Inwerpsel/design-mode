import React, { useContext, useEffect, useState }  from "react";
import { get, use } from "../../state";
import { TextControl } from "../controls/TextControl";
import { Tutorial } from "../../_unstable/Tutorial";
import { DragHandle } from "../movable/DragHandle";
import { scopesByProperty } from "../../functions/collectRuleVars";
import { ThemeEditorContext } from "../ThemeEditor";
import { Checkbox } from "../controls/Checkbox";

const minPrefixAmount = 4;

function getPossiblePrefixes(name) {
  const parts = name.replace(/^--/, '').split('-');
  const prefixes = [];

  for (let i = 0; i < 3 && i < parts.length; i++) {
    prefixes.push(parts.slice(0, i + 1).join(' '));
  }

  return prefixes;
}

function detectPrefixes(allVars) {
  const allPrefixes = new Map();
  function initPrefix(str) {
    if (!allPrefixes.has(str)) {
      allPrefixes.set(str, new Set());
    }
    return allPrefixes.get(str);
  }
  // All prefixes found more than min, sorted by occurrences
  for (const cssVar of allVars) {
    if (!cssVar.name.startsWith('--')) {
      continue;
    }
    for (const prefix of getPossiblePrefixes(cssVar.name)) {
      const set = initPrefix(prefix.trim());
      set.add(cssVar.name);
    }
  }

  for (const name of Object.keys(scopesByProperty)) {
    for (const prefix of getPossiblePrefixes(name)) {
      const set = initPrefix(prefix.trim());
      set.add(name);
    }
  }

  const filtered = [...allPrefixes.entries()].filter(([, set]) => set.size > minPrefixAmount);

  const sorted = filtered.sort(([,setA], [,setB]) => setB.size - setA.size);

  return sorted;
}

export function RemoveAnnoyingPrefix() {
  const {
    allVars,
  } = useContext(ThemeEditorContext);

  const [detectionResult, setDetectionResult] = useState(null);
  const [multiMode, setMultiMode] = useState(false);
  const [nResults, setNResults] = useState(5);
  const [annoyingPrefix, setAnnoyingPrefix] = use.annoyingPrefix();
  const [multiSelection, setMultiSelection] = useState(new Set());

  function addToMultiSelect(prefix) {
    multiSelection.has(prefix) ? multiSelection.delete(prefix) : multiSelection.add(prefix);
    setMultiSelection(new Set(multiSelection));
  }

  function confirmMultiSelection() {
    setAnnoyingPrefix(`${[...multiSelection.values()].join('|')}`)
    setDetectionResult(null);
  }

  function setPrefixAndCleanup(prefix) {
    setAnnoyingPrefix(prefix);
    setDetectionResult(null);
  }

  return <div>
    <Tutorial
      el={RemoveAnnoyingPrefix}
      tasks={[() => [
        'Ignore either "bs" or "lm"',
        ['lm', 'bs'].includes(get.annoyingPrefix)
      ]]}
      >
        It's very common for token names to all start with a prefix that takes up valuable screen real estate.

        In case of Bootstrap it's "bs", for Halfmoon you find a lot of redundant "lm" prefixes.
    </Tutorial>
    <DragHandle />
    <TextControl
      placeholder='Remove annoying prefix'
      title='Remove annoying prefix'
      value={annoyingPrefix}
      onChange={setAnnoyingPrefix}
      style={{
        textDecoration: 'line-through',
        textDecorationColor: 'grey',
        textDecorationThickness: '1px',
      }}
    />
    {!detectionResult && <button onClick={() => {
      setDetectionResult(detectPrefixes(allVars))
    }}>Detect</button>}
    {detectionResult && <button onClick={() => {setDetectionResult(null)}}>Close</button>}
      
    {detectionResult && <div>
      <input
        type="number"
        min="1"
        value={nResults}
        onChange={e => {setNResults(e.target.value)}}
      />
      <Checkbox controls={[multiMode, setMultiMode]}>Multi</Checkbox>
      {multiMode && multiSelection?.size > 0 && <button onClick={confirmMultiSelection}>Confirm multi select</button>}
      <button onClick={() => {setAnnoyingPrefix('')}}>None</button>
      {detectionResult.slice(0, nResults).map( ([prefix, set]) => <div key={prefix}>
        <button
          style={prefix === annoyingPrefix 
            ? {background: 'lightblue'}
            : multiMode && multiSelection.has(prefix)
            ? {background: 'yellow'}
            : !multiMode && prefix.startsWith(annoyingPrefix)
            ? {background: 'yellow'}
            : {}
          }
          onClick={(multiMode ? addToMultiSelect : setPrefixAndCleanup).bind(null, prefix)}
          title={[...set.values()].join('\n')}
        >{multiMode && multiSelection.has(prefix) && <input type="checkbox" checked/>}{prefix} ({set.size})</button>
      </div>)}
    </div>}
  </div>;
}

RemoveAnnoyingPrefix.fName = 'RemoveAnnoyingPrefix';