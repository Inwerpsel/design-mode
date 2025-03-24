import React, { Fragment, useState } from "react";
import { Checkbox } from "../controls/Checkbox";
import { ElementLocator } from "../ui/ElementLocator";
import { FormatVariableName } from "./VariableControl";
import { dragValue } from "../../functions/dragValue";
import { getLocateSelector } from "./VariableUsages";

export function VariableReferences(props) {
  const { references, excludedVarName } = props;

  const [filterFound, setFilterFound] = useState(true);

  if (references.length === 0) {
    return null;
  }

  return (
    (<div style={{ marginLeft: '24px', marginTop: '8px' }}>
      <Checkbox
        title={'Show only elements that were found on the page '}
        controls={[filterFound, setFilterFound]}
      >
        Filter found
      </Checkbox>
      <ul style={{ marginTop: '0' }}>
        {references.map(([{name, usages}, scopes]) => {
          if (name === excludedVarName) {
            return null;
          }
          return <li key={name} style={{marginTop: '1rem'}}>
            <h5 style={{fontWeight: 'bold'}}>
              <FormatVariableName {...{ name }} />
            </h5>
            <ul>{scopes.map(scope => {
              const innerSelector = usages.reduce((a, u) => (a + ',' + u.selector), '').replace(/^,/, '');
              const locateSelector = getLocateSelector(
                scope,
                innerSelector
              );

              return (
                <li key={name} style={{ borderBottom: '1px solid gray' }}>
                  {scope !== ':root' && <code style={{marginTop: '4px', fontSize: '1.5rem'}} className="monospace-code">{scope}</code>}
                  <div
                    draggable
                    onDragStart={dragValue(() => `var(${name})`)}
                  >
                  </div>
                  <ElementLocator
                    label={innerSelector}
                    hideIfNotFound={filterFound}
                    initialized
                    // Quick fix, this won't be needed once inspection is rewritten.
                    selector={locateSelector}
                  >
                  </ElementLocator>
                </li>
              );
            })}</ul>
          </li>;
        })}
      </ul>
    </div>)
  );
}