import React, { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { PreviewValue } from "../inspector/VariableControl";
import { ThemeEditorContext } from "../ThemeEditor";
import { definedValues, scopesByProperty } from "../../functions/collectRuleVars";
import { ToggleButton } from "../controls/ToggleButton";
import { VariableUsages } from "../inspector/VariableUsages";
import { VariableReferences } from "../inspector/VariableReferences";
import { dragValue } from "../../functions/dragValue";
import { MovableElementContext, useCompactSetting } from "../movable/MovableElement";
import { CompactModeButton } from "../movable/CompactModeButton";
import { Tutorial } from "../../_unstable/Tutorial";
import { get, use } from "../../state";
import { TextControl } from "../controls/TextControl";

function PaletteEntry(props) {
  const {value, isHtml} = props;
  const varName = value.replace(/var\(/, '').replace(/\)$/, '').trim();
  const isVar = varName !== value && /^[\w\-]+$/.test(varName);
  const ref = useRef();

  useEffect(() => {
    if (!isHtml) return;


  }, [value]);

  if (isHtml) {
    return <div style={{pointerEvents: 'none'}} dangerouslySetInnerHTML={{__html: value}}/>
  }

  return (
    <div
      {...{ref}}
      style={{ listStyleType: 'none' }}
      draggable
      onDrag={(event) => {
        event.dataTransfer.setData('value', value);
        event.stopPropagation();
      }}
    >
      {isVar ? <Variable {...{value, varName}} /> : <RawValue {...{value}} />}
    </div>
  );
}

function RawValue(props) {
  // Always same.

  const {value} = props;
  const cssVar = {name: value, value, usages: []};

  return <div>
    <PreviewValue {...{ value, cssVar, resolvedValue: value }} />
  </div>
}

function Variable(props) {
  // Context and history dependent: list all scopes and their value.

  // This list also changes throughout time.

  // When adding a variable that was recently created, going back in history
  // will cause it to be undefined.
  // Probably drag should be prevented when that occurs, as using it would
  // chop off the future and hence make you add an empty variable.
  // In case of a variable with no other references, it could be created
  // instead.

  const {value, varName} = props;
  const {themeEditor: {scopes}} = get;

  const {
    allVars,
  } = useContext(ThemeEditorContext);

  const [showUsages, setShowUsages] = useState(false);

  const cssVar = allVars.find(v=>v.name === varName) || {name: varName, usages: []};
  const references = useMemo(() => {
    // Prevent much unneeded work on large lists.
    if (!showUsages) {
      return null;
    }
    if (!cssVar.name?.startsWith('--')) {
      return [];
    }
    const regexp = new RegExp(
      `var\\(\\s*${cssVar.name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`
    );

    const refs = [];

    for (const otherVar of allVars) {
      const {name} = otherVar;
      if (!name?.startsWith('--')) {
        continue;
      }
      const matchScopes = new Set();
      Object.entries(scopes).forEach(([selector, vars])=>{
        if (vars[name] && regexp.test(vars[name])) {
          matchScopes.add(selector);
        }
      });
      Object.entries(definedValues).forEach(([selector, vars]) => {
        if (matchScopes.has(selector)) return;
        const value = vars[name];

        if (value && value.includes('--') && regexp.test(value)) {
          matchScopes.add(selector);
        }
      });
      if (matchScopes.size > 0) {
        refs.push([[...matchScopes.values()], otherVar]);
      }
    }
    return refs;
  }, [scopes, showUsages]);

  const baseValues = Object.entries(scopesByProperty[varName] || {});
  let values;
  if (baseValues.length === 0) {
    const editorValues = [];
    for (const [selector, vars] of Object.entries(scopes)) {
      for (const [name, value] of Object.entries(vars)) {
        if (name === varName) {
          editorValues.push([selector, value]);
        }
      }
    }
    values = editorValues;
  } else {
    values = baseValues;
  }

  if (values.length === 0) {
    return <div>
      <b>{varName} <span style={{color: 'red'}}>is undefined</span></b>
    </div>
  }

  if (values.length === 1) {
    const value = values[0][1];

    return <div>
      <b draggable onDragStart={dragValue(value)}>{varName}</b>
      <PreviewValue {...{cssVar, value, resolvedValue: value}}/>
      <ToggleButton controls={[showUsages, setShowUsages]}>Usages</ToggleButton>
      {showUsages && <Fragment>
        <VariableReferences {...{references}} />
        <VariableUsages {...cssVar}/>
        </Fragment>}
    </div>
  }

  return <div>
    <b draggable onDragStart={dragValue(value)}>{varName} ({values.length})</b>
    <ul>
      {values.map(([selector,v]) => <li key={selector} style={{clear: "both"}}>
        <span className="monospace-code">{selector}</span>
        <PreviewValue value={(selector in scopes && varName in scopes[selector]) ? scopes[selector][varName] : v} {...{cssVar}}/>
      </li>)}
    </ul>
  </div>
}

function MiniPalette({values, setValues, width = 65, mini = false}) {
  const [pickedValue, setPickedValue] = use.pickedValue();
  const hasPickedValue = values.some(({value}) => value === pickedValue);
  const [isVertical, setIsVertical] = useLocalStorage('palette-vertical', false);
  const [dragmode, setDragmode] = useState(false);

  useEffect(() => {
    if (dragmode) {
      const listener = () => {setDragmode(false);};
      document.addEventListener('drop', listener);
      document.addEventListener('dragend', listener);
      return () => {
        document.removeEventListener('drop', listener);
        document.removeEventListener('dragend', listener);
      }
    }
  }, [dragmode]);
  
  useEffect(() => {
    setDragmode(false);
  }, [values])

  return <div
    style={{display: 'flex', flexDirection: isVertical ? 'column' : 'row'}}
  >
    {(dragmode || hasPickedValue) && <div 
      style={{fontSize: '25px', fontWeight: 'bold', textAlign: 'center', border: '1px dashed grey', minWidth: '42px'}}
      onClick={() => setValues(values.filter(({ value }) => value !== pickedValue))}
      onDrop={(event) => {
        const toRemove = event.dataTransfer.getData('value');
        if (toRemove === undefined) {
          return;
        }
        setValues(values.filter(({ value: v }) => v !== toRemove));
      } }
    >🗑</div>}
    {!mini && <div className={isVertical ? 'flex-row' : 'flex-column'}>
      <ManagedPalette />
      {/* <DragHandle /> */}
    </div>}
    
    
    {!dragmode && !hasPickedValue && <ToggleButton style={{maxWidth: '28px'}} controls={[isVertical, setIsVertical]}>{isVertical ? '⇓' : '⇒'}</ToggleButton>}
    {values.map(({ value, isHtml }, index) => {
      // This doesn't really serve a purpose, but it's interesting to see how the browser treats the styles,
      // when copying fragments of HTML to the clipboard.
      // Surprisingly, many things will still look proper and show the results of changes made in the editor.
      // The problem is many inline styles get added and will overrule things, and it's quite hard to know
      // which inline styles could be removed from the copied markup.
      if (isHtml) {
        return <div
          style={{
            width,
            height: width,
            overflow: 'hidden',
            background: 'white',
          }}
          draggable
          onDragStart={dragValue(value, () => setDragmode(true))}
        >
          <div style={{width: '320px', transform: 'scale(.3)', transformOrigin: 'left top'}} dangerouslySetInnerHTML={{__html: value}}/>
        </div>;
      }

      return (
        <span style={{display: 'inline-block'}}>
          <span
            key={value}
            draggable
            onClick={() => {
              setPickedValue(pickedValue === value ? '' : value);
            }}
            onDragStart={dragValue(value, () => setDragmode(true))}
            title={value}
            onDrop={(event) => {
              let isHtml = false, value = event.dataTransfer.getData('value');
              if (value === '') {
                value = event.dataTransfer.getData('text/html').trim();
                isHtml = true;
              }
              if (value === '') {
                value = event.dataTransfer.getData('text/plain').trim();
              }
              if (
                values.some(
                  ({ value }) => value === event.dataTransfer.getData('value')
                )
              ) {
                const filtered = values.filter(({value: otherv}) => value !== otherv );
                const newValues = [...filtered.slice(0, index), { value, isHtml }, ...filtered.slice(index)];
                setValues(newValues);
                event.stopPropagation();
              } else {
                setValues([{ value, isHtml }, ...values]);
                event.stopPropagation();
              }

            }}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              margin: '2px',
              backgroundImage: `${value}`,
              backgroundColor: value,
              backgroundRepeat: `no-repeat`,
              backgroundSize: 'cover',
              fontSize: '14px',
              textShadow: 'white 0px 10px',
              lineHeight: '20px',
              width,
              height: width,
              outline: value === pickedValue ? '4px solid yellow' : 'none',
            }}
          >
            {value}
          </span>
          {/* {isVertical && <button
            style={{ verticalAlign: 'top' }}
          >
            X
          </button>} */}

        </span>
      );
    })}
  </div>
}

function MaxiPalette({values, setValues}) {
  return <ul style={{ display: 'flex', flexDirection: 'column', maxWidth: '320px' }}>
        {values.map((entry) => {
          const { value } = entry;

          return (
            <li
              key={value}
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <PaletteEntry {...{value}} {...entry} />
              <button
                style={{ alignSelf: 'flex-end' }}
                onClick={() => {
                  setValues(values.filter((v) => v !== entry));
                }}
              >
                X
              </button>
            </li>
          );
        })}
      </ul>
}

function ManagedPalette() {
  const [palette, setPalette] = use.palette();
  const [open, setOpen] = useState(false);
  const [openStored, setOpenStored] = useLocalStorage('manage palettes open', false);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const [storedPalettes, setStoredPalettes] = useLocalStorage('palettes', []);
  const currentEmpty = palette.length === 0;

  return (
    <div>
      <ToggleButton controls={[open, setOpen]}>...</ToggleButton>
      {open && (
        <Fragment>
          <TextControl value={name} onChange={setName} />
          <button
            disabled={trimmed === ''}
            onClick={() => {
              setStoredPalettes([
                ...storedPalettes,
                { name, contents: palette },
              ]);
            }}
          >save</button>
          <button disabled={currentEmpty} onClick={() => {
            if (!currentEmpty) {
              setStoredPalettes([...storedPalettes, {name: 'tmp', contents: palette}]);
            }
            setPalette([]);
          }}>clear</button>
          <ToggleButton controls={[openStored, setOpenStored]}>Stored palettes</ToggleButton>
          {openStored && (
            <ul>
              {storedPalettes.map(({ name, contents = [], palette }) => (
                <li key={name} style={{display: 'flex', justifyContent: 'flex-end'}}>
                  {name} ({contents.length})
                  <MiniPalette mini values={contents} setValues={() => {}} width={20}/>
                  <button onClick={() => {
                    if (!currentEmpty) {
                      setStoredPalettes([...storedPalettes, {name: 'tmp', contents: palette}]);
                    }
                    setPalette(contents);
                  }}>restore</button>
                  <button onClick={() => {
                    if (!confirm(`Delete palette "${name}"?`)) {
                      return;
                    }
                    setStoredPalettes(storedPalettes.filter(({name: otherName}) => otherName !== name));
                  }}>X</button>
                </li>
              ))}
            </ul>
          )}
        </Fragment>
      )}
    </div>
  );
}

export function Palette() {
    const [pickedValue, setPickedValue] = use.pickedValue();
    const [values, setValues] = use.palette();
    const [compact] = useCompactSetting();

    return (
      <div
        // onDragEnter={preventDefault}
        onDragOver={(event) => {
          if (
            !values.some(
              ({ value }) => value === event.dataTransfer.getData('value')
            )
          ) {
            event.preventDefault();
          }
        }}
        onClick={() => {
          if (pickedValue !== '' && !values.some(({value}) => value === pickedValue)) {
            setValues([{ value: pickedValue, isHtml: false }, ...values]);
            setPickedValue('');
          }
        }}
        onDrop={(event) => {
          let isHtml = false, value = event.dataTransfer.getData('value');
          if (value === '') {
            value = event.dataTransfer.getData('text/html').trim();
            isHtml = true;
          }
          if (value === '') {
            value = event.dataTransfer.getData('text/plain').trim();
          }
          if (
            !values.some(
              ({ value }) => value === event.dataTransfer.getData('value')
            )
          ) {
            setValues([{ value, isHtml }, ...values]);
          }

          event.stopPropagation();
        }}
      >
        <CompactModeButton />
        {values.length === 0 && <span>Empty<br/></span>}
        {compact ? <MiniPalette {...{values, setValues}}/> : <MaxiPalette  {...{values, setValues}}/>}
        <Tutorial el={Palette} tasks={[
          () => [`Add 2 items to the palette (${Math.min(2, values.length)}/2)`, values.length > 1],
        ]}>
          You can drop values from almost anywhere here, and drag them onto the page and UI elements later.
          </Tutorial>
      </div>
    );
}

Palette.fName = 'Palette';