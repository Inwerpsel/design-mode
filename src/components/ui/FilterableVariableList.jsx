import React, { useState, useMemo, Fragment, useRef, useEffect } from "react";
import { definedValues } from "../../functions/collectRuleVars";
import { ROOT_SCOPE } from "../../hooks/useThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { TextControl } from "../controls/TextControl";
import { PREVIEW_SIZE } from "../properties/ColorControl";
import { dragValue } from "../../functions/dragValue";
import { get } from "../../state";
import { FormatVariableName } from "../inspector/VariableControl";

const rootSelectors = [':root', ':where(html)', 'html']
const initialWindowSize = 20;

export function FilterableVariableList(props) {
    const {themeEditor: {scopes}} = get;
    const theme = scopes[ROOT_SCOPE] || {};
    const {value, onChange, elementScopes = []} = props;
    const [filter, setFilter] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [includeRoot, setIncludeRoot] = useState(true);
    const currentRef = useRef();

    useEffect(() => currentRef.current?.scrollIntoView({block: 'nearest'}), [value])

    const filtered = useMemo(() => {
        const fromDefinedValues = Object.entries(definedValues)
        .reduce((all, [selector, vars]) => {
            if (elementScopes.some(s => s.selector === selector) || (includeRoot && rootSelectors.includes(selector))) {
                for (const key in vars) {
                    all[key] = vars[key];
                }
            }

            return all;
        }, {})

        const base = {...fromDefinedValues, ...theme};

        return Object.entries(base).filter(
          ([name, value]) =>
            typeof value !== 'undefined' &&
            value !== '' &&
            (!filter || new RegExp(filter.replaceAll(' ', '(\\-\\-?| )')).test(name)) &&
            (!filterValue || new RegExp(filterValue.replaceAll(' ', '(\\-\\-?| )')).test(value))
        );
    }, [filter, filterValue, theme, includeRoot]);

    const [doFull, setDoFull] = useState(false);

    const activeIndex = doFull ? null : filtered.findIndex(([name]) => `var(${name})` === value);
    const min = doFull ? null : activeIndex - initialWindowSize;
    const max = doFull ? null : activeIndex + initialWindowSize;

    const timeAtRender = performance.now();

    return (
      <div onClick={(e) => e.stopPropagation()} style={{}}>
        <Checkbox controls={[includeRoot, setIncludeRoot]}>Global values</Checkbox>
        <div style={{ display: 'flex', width: '100%' }}>
          <TextControl 
            placeholder={`Filter name ${filtered.length}`}
            value={filter}
            onChange={setFilter}
          />
          <TextControl 
            placeholder={`Filter value ${filtered.length}`}
            value={filterValue}
            onChange={setFilterValue}
          />
        </div>
        <ul
          style={{
            maxHeight: '50vh',
            background: 'white',
            overflowY: 'scroll',
            scrollBehavior: 'auto',
          }}
          onScroll={() => {
            if (performance.now() - timeAtRender > 200) {
              setDoFull(true)
            }
          }}
        >
          {filtered.map(([name, optionValue], index) => {
              if (!doFull && (index < min || index > max)) {
                return;
              }
              const varValue = `var(${name})`;
              const isCurrent = varValue === value;

              const insides = (
                <Fragment>
                  <span style={{display: 'flex', justifyContent: 'space-between', flexGrow: 1}}>
                    <FormatVariableName {...{name, style: {fontWeight: 600}}} />
                    {/* Exclude some values that get too long. */}
                    {!/url\(|gradient\(/.test(optionValue) && (
                      <span style={{ maxWidth: '30%' }}>{optionValue}</span>
                    )}
                  </span>
                  <span
                    draggable
                    onDragStart={dragValue(varValue)}
                    key={name}
                    title={optionValue}
                    style={{
                      width: PREVIEW_SIZE,
                      height: PREVIEW_SIZE,
                      border: '1px solid black',
                      borderRadius: '6px',
                      background: `no-repeat left top/ cover ${optionValue}`,
                      float: 'right',
                      textShadow: 'white 0px 10px',
                      // backgroundSize: 'cover',
                    }}
                  >
                    {/var\(/.test(optionValue) && 'var'}
                  </span>
                </Fragment>
              );

              return (
                <li key={name} ref={isCurrent ? currentRef : null}>
                  <button
                    onClick={() => {
                      !isCurrent && onChange(varValue);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      border: isCurrent ? '4px solid black' : '1px solid black',
                    }}
                  >
                    {insides}
                  </button>

                </li>
              );
          })}
        </ul>
      </div>
    );
}