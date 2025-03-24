import React, {useState, useMemo, Fragment, useContext, useRef} from 'react';
import {mustBeColor, TypedControl} from './TypedControl';
import { PSEUDO_REGEX, ACTIONS, ROOT_SCOPE} from '../../hooks/useThemeEditor';
import classnames from 'classnames';
import {COLOR_VALUE_REGEX, GRADIENT_REGEX, PREVIEW_SIZE} from '../properties/ColorControl';
import {match} from 'css-mediaquery';
import {isOverridden, VariableScreenSwitcher} from './VariableScreenSwitcher';
import {ThemeEditorContext} from '../ThemeEditor';
import {IdeLink} from './IdeLink';
import { definedValues } from '../../functions/collectRuleVars';
import { VariableReferences } from './VariableReferences';
import { FilterableVariableList } from '../ui/FilterableVariableList';
import { VariableUsages } from './VariableUsages';
import { useResumableState } from '../../hooks/useResumableReducer';
import { get, use } from '../../state';
import { MediaQueries } from './MediaQueries';
import { ToggleButton } from '../controls/ToggleButton';
import { dragValue } from '../../functions/dragValue';
import { findClosingBracket } from '../../functions/compare';
import { CalcSizeControl, isSingleMathExpression } from '../properties/CalcSizeControl';
import { onLongPress } from '../../functions/onLongPress';

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);
const format = name => {
  if (!/^--/.test(name)) {
    return ['', ''];
  }
  // todo: make this make more sense
  const raw = name
    .replace(/^--/, '')
    .replace(/[-_]/g, ' ');
  const parts =  raw.split('--');

  return [
    parts.slice(0, - 1).join(' — '),
    parts[parts.length - 1].trim().replace(/ /g, '-')
  ];
};
const preventDefault = e=>e.preventDefault();
export const FormatVariableName = ({name, style}) => {
  const {annoyingPrefix, nameReplacements} = get
  const [prefix, prop] = format(name);
  let formattedProp = prop.replaceAll(/-/g, ' ').trim();

  if (annoyingPrefix) {
    try {
      formattedProp = formattedProp.replace( new RegExp(`^${annoyingPrefix} `), '').trim();
    } catch (e) {
    }
  }

  formattedProp = !nameReplacements
    ? formattedProp
    : nameReplacements
        .filter((r) => r.active && r.to.length > 0 && r.from.length > 1)
        .reduce(
          (prop, { from, to }) => {
            try {
              return prop.replace(new RegExp(from), to);
            } catch(e) {
              console.log(`Failed replacing ${from} to ${to}`)
              return prop;
            }
          },
          formattedProp
        );

  let annoyingRegex;
  try {
    annoyingRegex = new RegExp(`^${annoyingPrefix}\\s*\\—\\s*`);
  } catch (e) {
  }
  const cleanedPrefix = prefix.trim().replace(annoyingRegex, '');

  return <span draggable onDragStart={dragValue(`var(${name})`)} {...{style}}>
    <span
      style={{
        fontSize: '13px',
        fontStyle: 'italic',
        color: 'black',
        display: 'block',
      }}
    >{capitalize(annoyingPrefix ? cleanedPrefix : prefix)}</span>
    <span className={'var-control-property'}>{formattedProp}</span>
  </span>;
};

export const PreviewValue = ({value, resolvedValue = value, cssVar, isDefault, referencedVariable, isOpen, group}) => {
  const size = PREVIEW_SIZE;
  const title = `${value}${!isDefault ? '' : ' (default)'}`;
  const isUrl = /url\(/.test(resolvedValue);
  const isColor =
    mustBeColor(cssVar) ||
    COLOR_VALUE_REGEX.test(resolvedValue) ||
    GRADIENT_REGEX.test(resolvedValue);
  const presentable = isColor || isUrl;

  if (resolvedValue && presentable && resolvedValue !== 'currentcolor') {
    return (
      <Fragment>
        <span
          className='var-preview'
          draggable
          onDragStart={dragValue(resolvedValue)}
          title={title}
          style={{
            width: size,
            height: size,
            border: '1px solid black',
            borderRadius: '6px',
            backgroundImage: `${resolvedValue}`,
            backgroundColor: cssVar.cssFunc ? `${cssVar.cssFunc}(${resolvedValue})` : resolvedValue,
            backgroundRepeat: `no-repeat`,
            backgroundSize: 'cover',
            // background:,
            float: 'right',
            textShadow: 'white 0px 10px',
            // backgroundSize: 'cover',
          }}
        >
          {/var\(/.test(value) && 'var'}
          {resolvedValue === 'transparent' && '👻'}
        </span>
        <span style={{ float: 'right', marginRight: '4px' }}>
          {referencedVariable && <FormatVariableName name={referencedVariable.name} />}
          {!referencedVariable && (isUrl ? null : value)}
        </span>
      </Fragment>
    );
  }
  if (referencedVariable && isOpen) {
    
    return null;
  }

  const isContent = resolvedValue.startsWith('"') || resolvedValue.startsWith("'") || resolvedValue.startsWith('attr(');

  const previewString = isContent ? resolvedValue.replaceAll('" "', '"\n"') : value;
  // const previewString = value;

  return <span
    className='var-preview'
    draggable
    onDragStart={dragValue(value)}
    key={ 1 }
    title={ title }
    style={ {
      // width: size,
      fontSize: '14px',
      float: 'right',
      fontFamily: !isContent ? null : group?.computedStyles?.fontFamily,
      whiteSpace: 'pre-wrap',
    } }
  >
    { referencedVariable ? <FormatVariableName name={referencedVariable.name} /> : previewString}
  </span>;
};

// Get values from specificity ordered scopes.
export function getValueFromDefaultScopes(scopes, cssVar) {
  if (!scopes) {
    return null;
  }
  for (const {selector} of scopes) {
    if (definedValues[selector]?.hasOwnProperty(cssVar.name)) {
      return definedValues[selector][cssVar.name];
    }
  }
  return null;
}

function referenceChainKey(references, cssVar) {
  return [...references, cssVar].map(v=>v.name).join();
}

export const mediaMatchOptions = {
  type: 'screen',
  // Below are some values which can later be pulled from settings.
  // This way the `match` dependency can properly resolve all media rules.
  // Hence this list will contain some obscure entries that will likely never be used.
  // Entries for which no clear value can be determined are not included for now.
  'any-hover': 'hover',
  'any-pointer': 'fine',
  // 'aspect-ratio': '',
  // 'color': '',
  // 'color-gamut': '',
  // 'color-index': '',
  // The following 3 are deprecated, but perhaps still common enough?
  // 'device-aspect-ratio': '',
  // 'device-height': '',
  // 'device-width': '',
  // 'display-mode': '',
  // 'dynamic-range': 'standard',
  'forced-colors': 'none',
  // grid: '',
  hover: 'hover',
  'inverted-colors': 'none',
  // monochrome: '',
  // orientation: width > height ? 'landscape' : 'portrait',
  // 'overflow-block': '',
  // 'overflow-inline': '',
  pointer: 'fine',
  'prefers-color-scheme': 'no-preference',
  'prefers-contrast': 'no-preference',
  'prefers-reduced-motion': 'no-preference',
  'prefers-reduced-transparency': 'no-preference',
  // resolution: '',
  scripting: 'enabled',
  update: 'fast',
        // 'video-dynamic-range': 'standard',
};

const maxNesting = 20;
// Look up value in edited state and default state.
export function resolveVariables(value = '', elementScopes, scopes, nestingLevel = 0, inlineStyles = {}, inheritedInlineStyles = {}) {
  if (nestingLevel > maxNesting) {
    return ['<<invalid: circular reference>>'];
  }
  const vars = [];

  let matchIndex;
  while (matchIndex = value.indexOf('var(--'), matchIndex !== -1) {
    const openingBracket = matchIndex + 3;
    const closingBracket = findClosingBracket(value, openingBracket);
    const args = value.slice(openingBracket + 1, closingBracket).trim();
    const firstComma = args.indexOf(',');
    const noComma = firstComma === -1;
    const name = noComma ? args : args.slice(0, firstComma).trim();
    // const name = '--' + value.slice(matchIndex + 6).replace(/[\s\),].*/, '')
    const inlineValue = inlineStyles[name] || inheritedInlineStyles[name];
    let replacingValue;
    for (const {selector} of elementScopes || []) {
      if (name in (scopes[selector] || {})) {
        replacingValue = scopes[selector][name]
        // console.log('replace from editor', {name,value, replacingValue});
        break;
      }
      if (name in (definedValues[selector] || {})) {
        replacingValue = definedValues[selector][name]
        // console.log('replace from defaults', {name,value, replacingValue, definedValues, selector});
        break;
      }
    }
    if (inlineValue !== undefined) {
      replacingValue = inlineValue;
    }
    if (!replacingValue) {
      if (noComma) {
        // debugger;
        return [value, vars, `<<invalid: "${name}" is undefined>>`];
      }
      const fallback = args.slice(firstComma + 1).trim();
      // console.log({fallback});
      replacingValue = fallback;
    }
    if (nestingLevel === 0 && !vars.includes(name)) {
      vars.push(name);
    }
    const [resolvedInner,,error] = resolveVariables(replacingValue, elementScopes, scopes, nestingLevel + 1, inlineStyles, inheritedInlineStyles);
    if (error) {
      console.log(error)
      return [value, vars, error];
    }
    value = value.slice(0, matchIndex) + resolvedInner + value.slice(closingBracket + 1);
  }

  return [value, vars];
}

export const VariableControl = (props) => {
  const {
    cssVar,
    onChange: _onChange,
    onUnset,
    referenceChain = [],
    scopes: elementScopes,
    parentVar,
    currentScope = ROOT_SCOPE,
    element,
    group,
  } = props;

  const {
    width,
    showCssProperties,
    linkCssProperties,
  } = get;
  const [{scopes: editedScopes}, dispatch] = use.themeEditor();

  const [pickedValue, setPickedValue] = use.pickedValue();

  const {
    defaultValues,
    allVars,
  } = useContext(ThemeEditorContext);

  const {
    name,
    usages,
    maxSpecific,
    positions,
    properties,
  } = cssVar;

  const uniqueSelectors = new Set(usages.map(u=>u.selector)).size;

  const inlineValue = group?.inlineStyles[name] || group?.inheritedInlineStyles[name];
  const usesInlineStyle = !!inlineValue;
  const onChange = usesInlineStyle ? () => {} : _onChange;

  const defaultValue = 
    inlineValue ||
    definedValues[currentScope][name] ||
    getValueFromDefaultScopes(elementScopes, cssVar) ||
    defaultValues[name] ||
    cssVar.maxSpecific?.defaultValue || cssVar.usages[0].defaultValue;

  const [overwriteVariable, setOverwriteVariable] = useState(false);

  const valueFromScope = !editedScopes || !editedScopes[currentScope] ? null : editedScopes[currentScope][name];

  const value = valueFromScope || defaultValue;
  const isDefault = value === defaultValue;
  const {media} = maxSpecific || {};

  // Resolve variables inside the value.
  // WIP: doesn't do all substitutions yet, but simple work.
  let [resolvedValue, referencedVars] = resolveVariables(value, elementScopes, editedScopes, 0, group?.inlineStyles, group?.inheritedInlineStyles);

  const [referencedVariable, usedScope] = useMemo(() => {
    const varMatches = value?.match(/^var\(\s*(\-\-[\w-]+)\s*[\,\)]/);
    const referredVar = !varMatches || varMatches.length === 0
      ? null
      : allVars.find((cssVar) => cssVar.name === varMatches[1]) || {
          name: varMatches[1],
          usages: [
            {
              property: cssVar.maxSpecific?.defaultValue || cssVar.usages[0].property,
              isFake: true,
            },
          ],
          properties: {},
          positions: [],
        };
    if (!referredVar) {
      return [];
    }
    const usedScope = elementScopes?.find((scope) =>
      scope.scopeVars.some((v) => v.name === varMatches[1])
    )?.selector;
    return [referredVar, usedScope];
  }, [value]);

  const matchesScreen = useMemo(() => {
    const {overridingMedia} = cssVar.allVar || cssVar;
    if (!media) {
      return true;
    }
    try {
      const matchesQuery =
        match(media, {
          width,
          ...mediaMatchOptions,
        });

      return matchesQuery && (!overridingMedia || !isOverridden({media, cssVar, width}))
    } catch (e) {
      return true;
    }
  }, [width]);

  let currentLevel = referenceChain.length;
  const key = referenceChainKey(referenceChain, cssVar);

  const excludedVarName = parentVar?.name;

  // Todo: Dynamic keys for the following state doesn't work well,
  // because there's too many different kinds of entries in the timeline.
  // UX would probably be better if this state can be pinned together with
  // the open inspector groups.

  // Open all variables that refer to variables immediately.
  const [isOpen, setIsOpen] = 
    useResumableState(`open_${key}`, currentLevel > 0 && !!referencedVariable);
  const toggleOpen = () => setIsOpen(!isOpen );
  const [showSelectors, setShowSelectors] =
    useResumableState(`showSelectors_${key}`, false);
  const [showReferences, setShowReferences] = 
    useResumableState(`showRefs_${key}`, false);
  const [openVariablePicker, setOpenVariablePicker] = 
    useResumableState(`showPicker_${key}`, false);

  const references = useMemo(() => {
    // Prevent much unneeded work on large lists.
    if (!isOpen) {
      return [];
    }
    if (!name.startsWith('--')) {
      return [];
    }
    const hasRef = new RegExp(
      `var\\(\\s*${name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`
    );

    const matches = new Map();
    for (const [selector, vars] of Object.entries(editedScopes)) {
      for (const [otherName, otherValue] of Object.entries(vars)) {
        if (hasRef.test(otherValue)) {
          matches.set(otherName, [...(matches.get(otherName) || []), selector]);
        }
      }
    }
    for (const [selector, vars] of Object.entries(definedValues)) {
      const scopeEdited = selector in editedScopes;
      for (const [otherName, otherValue] of Object.entries(vars)) {
        if (scopeEdited && editedScopes[selector].hasOwnProperty(otherName)) {
          // Assume that if it exists in editor scopes, it has changed.
          continue;
        }
        if (hasRef.test(otherValue)) {
          matches.set(otherName, [...(matches.get(otherName) || []), selector]);
        }
      }
    }

    return [...matches.entries()].map(([name, selectors]) => [
      allVars.find((v) => v.name === name) || { name, usages: [] },
      selectors,
    ]);
  }, [editedScopes, isOpen]);

  const cssFunc = cssVar.cssFunc;
  // const openerRef = useRef();

  if (currentLevel > 20) {
    // Very long dependency chain, probably cyclic, let's break it here.
    // I'll prevent setting cyclic references in the first place.
    // Though this could also be an error in the source CSS.
    return null;
  }
  // const stickyOffset = 72 + currentLevel * 36;

  const isInTheme = name in (editedScopes[ROOT_SCOPE] || {}) || name in (editedScopes[currentScope] || {});

  const otherReferencesLength = references.length - (excludedVarName ? 1 : 0);

  return (
    (<li
      onDragEnter={cssVar.isRawValue ? null : preventDefault}
      onDragOver={cssVar.isRawValue ? null : preventDefault}
      onDrop={e=> {
        if (cssVar.isRawValue) {
          return;
        }
        const value = e.dataTransfer.getData('value');
        const regex = new RegExp(`var\\(\\s*${cssVar.name.replaceAll(/-/g, "\\-")}[\\s\\,\\)]`);
        // Prevent self reference.
        if (regex.test(value)) {
          return;
        }
        if (value) {
          onChange(value)
        }
        // e.preventDefault();
        e.stopPropagation();
        // e.stopImmediatePropagation();
      }}
      data-nesting-level={currentLevel}
      key={name}
      className={classnames('var-control', {
        'var-control-in-theme': isInTheme,
        'var-control-no-match-screen': !matchesScreen,
      })}
      onClick={() => {
        if (pickedValue && pickedValue !== value) {
          onChange(pickedValue);
          return;
        }
        if (pickedValue === '' || pickedValue === value) {
          if (!isOpen) toggleOpen();
        }
      }}
      style={{
        // userSelect: 'none',
        position: 'relative',
        listStyleType: 'none',
        fontSize: '15px',
        clear: 'both',
        cursor: isOpen ? 'auto' : 'pointer',
        paddingTop: 0,
      }}
    >
      {!matchesScreen && <VariableScreenSwitcher {...{ cssVar, media, element }} />}
      <div
        {...onLongPress((event) => {setPickedValue(value)})}
        // ref={openerRef}
        style={{
          // float: isOpen ? 'right' : 'none',
          paddingTop: 6,
          // position: isOpen ? 'sticky' : 'static',
          // zIndex: isOpen ? 11 : 0,
          // top: stickyOffset,
          // // top: 72 + currentLevel * 40,
          // minHeight: 40,
          // background: 'inherit',
        }}
        onClick={() => {
          if (isOpen) {
            toggleOpen();
          }
        }}
      >
        <h5
          draggable
          onDragStart={dragValue(() => `var(${name})`)}
          style={{
            display: 'inline-block',
            fontSize: '16px',
            padding: '0 4px 0',
            fontWeight: '400',
            userSelect: 'none',
            cursor: 'pointer',
            clear: 'left',
          }}
        >
          <FormatVariableName
            style={{
              fontWeight: referenceChain.length === 0 ? 'bold' : 'normal',
            }}
            {...{ name }}
          />
          {usesInlineStyle && <span style={{color: 'red'}}>inline</span>}
        </h5>
        <PreviewValue
          {...{ value, resolvedValue, cssVar, isDefault, referencedVariable, isOpen, group }}
        />
      </div>
      <div>
        {media && <MediaQueries {...{ media }} />}
        {!!showCssProperties && (
          <Fragment>
            {!!cssFunc && <span style={{ color: 'darkcyan' }}>{cssFunc}</span>}
            {Object.entries(properties).map(
              ([property, { isFullProperty, fullValue, isImportant }]) => {
                const isCurrent = property === maxSpecific?.property;
                const comp = (
                  <span
                    key={property}
                    className="monospace-code"
                    style={{
                      fontSize: '14px',
                      ...(!isCurrent ? { background: 'grey' } : {}),
                    }}
                    title={isFullProperty ? '' : fullValue}
                  >
                    {property}
                    {isCurrent && cssVar.states && !cssVar.pseudos && (
                      <b style={{ color: 'purple' }}>{cssVar.states}</b>
                    )}
                    {isCurrent && cssVar.pseudos && (
                      <a
                        target="_blank"
                        href={
                          !linkCssProperties
                            ? null
                            : `https://developer.mozilla.org/en-US/docs/Web/CSS/${cssVar.pseudos}`
                        }
                      >
                        <b style={{ color: 'indigo' }}>{cssVar.pseudos}</b>
                      </a>
                    )}
                    {!isFullProperty && <b style={{ color: 'red' }}>*</b>}
                    {!!isImportant && (
                      <b style={{ fontWeight: 'bold', color: 'darkorange' }}>
                        !important
                      </b>
                    )}
                  </span>
                );
                if (!linkCssProperties) {
                  return comp;
                }
                return (
                  <a
                    key={property}
                    target={'_blank'}
                    href={`https://developer.mozilla.org/en-US/docs/Web/CSS/${property.replace(/^-webkit-/, '')}`}
                    style={{ cursor: 'help' }}
                  >
                    {comp}
                  </a>
                );
              }
            )}
          </Fragment>
        )}
      </div>
      {!!positions[0] && <IdeLink {...(positions[0] || {})} />}
      {isOpen && (
        <Fragment>
          {otherReferencesLength > 0 && (
            <div>
              <ToggleButton
                // style={{ float: 'right', fontSize: '14px', position: 'sticky', top: stickyOffset + 36, zIndex: showReferences ? 9 : 0 }}
                controls={[showReferences, setShowReferences]}
              >
                {otherReferencesLength}{currentLevel > 0 && ' more'} links
              </ToggleButton>
              {showReferences && (
                <VariableReferences {...{ references, excludedVarName }} />
              )}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              clear: 'both',
              justifyContent: 'flex-end',
              // position: 'sticky',
              // top: stickyOffset + 42,
              // background: 'inherit',
              // zIndex: 9,
            }}
          >
            {isDefault && !cssVar.isRawValue && (
              <span
                style={{
                  margin: '6px 6px 0',
                  color: 'grey',
                }}
              >
                default
              </span>
            )}
            {isInTheme && defaultValue !== null && (
              <button
               title={`Remove from current theme? The value from the default theme will be used, which is currently: "${defaultValue}"`}
                onClick={() => {
                  onUnset();
                }}
              >
                Revert
              </button>
            )}

            {referencedVariable && (
              <button
                style={{borderWidth: overwriteVariable ? '4px' : '1px'}}
                onClick={() => {
                  setOverwriteVariable(!overwriteVariable);
                }}
              >
                Raw
              </button>
            )}

            {/^--/.test(cssVar.name) && <button
              style={{borderWidth: openVariablePicker ? '4px' : '1px'}}
              onClick={(event) => {
              setOpenVariablePicker(!openVariablePicker);
              event.stopPropagation();
            }}>
              Link
            </button>}

            {!usages[0].isFake && (
              <ToggleButton controls={[showSelectors, setShowSelectors]}>
                Rules ({uniqueSelectors})
              </ToggleButton>
            )}
          </div>
          {openVariablePicker && (
            <FilterableVariableList
              {...{value, elementScopes}}
              onChange={(value) => {
                // setOpenVariablePicker(false);
                onChange(value);
              }}
            />
          )}
          {showSelectors && !usages[0].isFake && (
            <Fragment>
              <div>{name}</div>
              <VariableUsages
                {...{
                  usages,
                  maxSpecificSelector: maxSpecific?.selector,
                  winningSelector: maxSpecific?.winningSelector,
                  scope: currentScope,
                }}
              />
            </Fragment>
          )}
          {(!referencedVariable || overwriteVariable) && !openVariablePicker && (
            <div
              // onMouseEnter={() => {
              //   PSEUDO_REGEX.test(name) &&
              //     dispatch({
              //       type: ACTIONS.startPreviewPseudoState,
              //       payload: { name },
              //     });
              // }}
              // onMouseLeave={() => {
              //   PSEUDO_REGEX.test(name) &&
              //     dispatch({
              //       type: ACTIONS.endPreviewPseudoState,
              //       payload: { name },
              //     });
              // }}
            >
              <TypedControl {...{ cssVar, value, resolvedValue, referencedVars, onChange, cssFunc, elementScopes }} />
            </div>
          )}
          {!name.startsWith('--') && isSingleMathExpression(name) && (
            <CalcSizeControl disabled {...{value, resolvedValue, referencedVars, onChange: () => {}, elementScopes}} />
          )}
          {!!referencedVariable && !overwriteVariable && (
            <ul style={{ margin: 0 }}>
              <span className='monospace-code'>{usedScope}</span>
              <VariableControl
                {...{ scopes: elementScopes, currentScope: usedScope,  }}
                cssVar={referencedVariable}
                onChange={(value) => {
                  dispatch({
                    type: ACTIONS.set,
                    payload: { name: referencedVariable.name, value, scope: usedScope },
                  });
                }}
                onUnset={() => {
                  dispatch({
                    type: ACTIONS.unset,
                    payload: { name: referencedVariable.name, scope: usedScope },
                  });
                }}
                key={referencedVariable.name}
                referenceChain={[...referenceChain, cssVar]}
                parentVar={cssVar}
              />
            </ul>
          )}
        </Fragment>
      )}
    </li>)
  );
};
