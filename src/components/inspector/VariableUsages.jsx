import React, {Fragment, useState} from 'react';
import {IdeLink} from './IdeLink';
import {ElementLocator} from '../ui/ElementLocator';
import { ROOT_SCOPE } from '../../hooks/useThemeEditor';
import { Checkbox } from '../controls/Checkbox';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { splitCommaSafeParentheses } from '../../functions/getOnlyMostSpecific';

const currentSelectorStyle = {
  background: 'yellow',
};

export function getLocateSelector(scope, selector) {
  if (scope.includes(':root')) {
    return selector
  }

  if (!scope || scope === selector || scope === ROOT_SCOPE || scope === 'body'  || scope === 'html' || scope === ':where(html)') {
    return selector;
  }

  return `
:where(
    ${scope},
    :is(${scope}) *
):where(
    ${selector}
)`;
}

function Usage(props) {
  const {
    scope,
    selector,
    highLightMatch,
    position,
    property,
    isLocal,
    hideIfNotFound,
    onlyCurrentPath = false,
  } = props;

  const locateSelector = isLocal ? getLocateSelector(scope, selector) : selector;

  if (!locateSelector) {
    return <li key={selector}>
      {!!position && <IdeLink {...position} />}
      <code>{selector}</code>;a
    </li>
  }

  return (
    <li key={selector} style={!highLightMatch ? {} : currentSelectorStyle}>
      {!!position && <IdeLink {...position} />}
      <ElementLocator
        label={selector}
        selector={locateSelector}
        initialized
        showLabel
        {...{property, hideIfNotFound, onlyCurrentPath}}
      >
      </ElementLocator>
    </li>
  );
}

export const VariableUsages = ({usages, maxSpecificSelector, winningSelector, scope = ':root'}) => {
  const [isLocal, setIsLocal] = useLocalStorage('use local scope selectors', true);
  const [hideIfNotFound, setHideNotFound] = useLocalStorage('hide not found usages', true);
  const [onlyCurrentPath, setOnlyCurrentPath] = useLocalStorage('filter selectors current path', false);
  const [openSelectors, setOpenSelectors] = useState({});
  const visitedSelectors = {};

  // const uniqueUsages = usages;
  const uniqueUsages = usages.filter(({selector}) => {
    if (selector in visitedSelectors) {
      visitedSelectors[selector]++;
      return false;
    }
    visitedSelectors[selector] = 1;

    return true;
  })

  const justOne = usages.length === 1;

  if (justOne && !usages[0].selector) {
    return null;
  }
  const isRootscope = scope.includes(':root');

  return (
    <Fragment>
      {!isRootscope && <Checkbox controls={[isLocal, setIsLocal]} title={scope}>In local scope</Checkbox>}
      {!justOne && <Checkbox controls={[hideIfNotFound, setHideNotFound]}>Only on this page</Checkbox>}
      {!justOne && <Checkbox controls={[onlyCurrentPath, setOnlyCurrentPath]}>Only inspected</Checkbox>}
      <ul>
        {uniqueUsages.map(({ property, selector, position }) => {
          const selectors = splitCommaSafeParentheses(selector);
          const highLightMatch =
            usages.length > 1 && selector === maxSpecificSelector;

          if (selectors.length > 1) {
            return (
              <li key={selector} style={{ border: '1px solid gray' }}>
                {!!position && <IdeLink {...position} />}
                {!onlyCurrentPath && !hideIfNotFound && <h4
                  style={!highLightMatch ? {} : currentSelectorStyle}
                  onClick={() =>
                    setOpenSelectors({
                      ...openSelectors,
                      [selector]: !openSelectors[selector],
                    })
                  }
                >
                  <div
                    className="monospace-code"
                    style={{ backgroundColor: '#d0d7de' }}
                  >
                    {selector
                      .replaceAll(/\s*\,\s*/g, ',\n')
                      .trim()
                      .substring(0, 100)}
                  </div>
                </h4>}
                <span className={'monospace-code'}>
                <span className={'var-control-property monospace-code'}>
                  {property}
                </span>
                </span>
                {!openSelectors[selector] && (
                  <ul style={{ marginLeft: '16px' }}>
                    {selectors.map((selector) => (
                      <Usage
                        key={`${isLocal ? 'l' : 'g'}~${selector}`}
                        {...{
                          scope,
                          selector,
                          highLightMatch,
                          position,
                          isLocal,
                          hideIfNotFound,
                          onlyCurrentPath,
                        }}
                      />
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          return (
            <Usage
              key={`${isLocal ? 'l' : 'g'}~${selector}`}
              {...{ scope, selector, highLightMatch, position, property, isLocal, hideIfNotFound, onlyCurrentPath }}
            />
          );
        })}
      </ul>
    </Fragment>
  );
};
