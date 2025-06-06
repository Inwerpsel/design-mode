import { useMemo, useState } from 'react';
import { ACTIONS, editTheme } from '../../hooks/useThemeEditor';
import { ToggleButton } from '../controls/ToggleButton';
// import { TextControl } from '../controls/TextControl';

export function Variate({
  currentScope,
  // elementScopes = [],
  name,
  value,
  onChange = () => {},
  group,
  groups,
}) {
  const dispatch = editTheme();
  const [open, setOpen] = useState(false);
  const [scopeName, setScopeName] = useState('');
  const [doDeeper, setDoDeeper] = useState(false);
  const [pickedGroup, setPickedGroup] = useState(group);

  const currentIndex = groups.indexOf(group);
  const isFirst = currentIndex === 0;

  const higherGroups = useMemo(() => {
    return groups.slice(0, currentIndex);
  }, [groups]);

  const options = useMemo(() => {
    const index = pickedGroup.scopes.findIndex(
      (s) => s.selector === currentScope
    );
    return pickedGroup.scopes
      .slice(0, index)
      .filter(
        ({ selector }) => selector !== 'body' && !selector.includes(':root')
      );
  }, [currentScope, pickedGroup]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className='relative'>
      {/* {open && !isFirst &&<ToggleButton controls={[doDeeper, setDoDeeper]}>Descendant</ToggleButton>} */}
      {doDeeper &&
        !isFirst &&
        higherGroups.map((g) => (
          <button
            onClick={() => {
              setPickedGroup(g);
            }}
          >
            {g.label}
          </button>
        ))}
      {open && (
        <div
          style={{ top: '100%', right: 0, zIndex: 99999999 }}
          className='absolute'
        >
          {/* <TextControl onChange={(v) => setScopeName(v)} value={scopeName}/> */}
          {scopeName !== '' && (
            <button
              style={{ borderWidth: '2px' }}
              className='monospace-code'
              onClick={() => {
                dispatch({
                  type: ACTIONS.set,
                  payload: {
                    name,
                    scope: scopeName,
                    value,
                  },
                });
                onChange();
              }}
            >
              {scopeName}
            </button>
          )}
          {options.map((s) => {
            return (
              <button
                style={{ borderWidth: '2px' }}
                className='monospace-code'
                onClick={() => {
                  dispatch({
                    type: ACTIONS.set,
                    payload: {
                      name,
                      scope: s.selector,
                      value,
                    },
                  });
                  onChange();
                }}
              >
                {s.selector}
              </button>
            );
          })}
        </div>
      )}

      <ToggleButton controls={[open, setOpen]}>Variate</ToggleButton>
    </div>
  );
}
