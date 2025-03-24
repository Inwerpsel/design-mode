import React, { Fragment, useContext, useMemo, useRef } from 'react';
import { filterSelectors, filterSearched } from '../../functions/filterSearched';
import { get } from '../../state';
import { GroupControl } from "../inspector/GroupControl";
import { mustBeColor } from '../inspector/TypedControl';
import { Tutorial } from '../../_unstable/Tutorial';
import { toNode } from '../../functions/nodePath';
import { ThemeEditorContext } from '../ThemeEditor';
import { getGroupsForElement } from '../../initializeThemeEditor';

const tutorial = (
  <Tutorial el={Inspector}>
    <p>
      The appearance of each element is determined by rules. These rules can be
      attached to the element itself, or to one of its parents.
    </p>
    <p>
      They are grouped in a box per element. You can hover the title of the box
      to highlight the corresponding element on the page.
    </p>
    <p>
      You can think of it as a tree view, except:
      <ul style={{ paddingLeft: '48px' }}>
        <li>
          It's upside down, so that the most useful information is easy to find
        </li>
        <li>
          Doesn't include the whole tree, only the section leading to the
          inspected element.
        </li>
        <li>
          Everything related to the element is here, so it's always obvious what
          applies to what
        </li>
      </ul>
    </p>
  </Tutorial>
);

export function Inspector() {
  const { frameRef } = useContext(ThemeEditorContext);
  const {
    propertyFilter,
    search,
    filteredSelectors,
    showRawValues,
    excludedRawValues,
    inspectedPath,
    texturedTree,
  } = get;

  let unfilteredGroups;
  try {
    const element = toNode(inspectedPath, frameRef.current?.contentWindow.document);
    unfilteredGroups = getGroupsForElement(element);
  } catch(e) {
    // console.log(e);
    unfilteredGroups = [];
  }

  const groups = useMemo(() => {
    const filteredBySelectors = filterSelectors(
      unfilteredGroups,
      filteredSelectors
    );
    const searched = filterSearched(filteredBySelectors, search);

    return searched.map((group) => ({
      ...group,
      vars: group.vars.filter((cssVar) => {
        if (
          (cssVar.isRawValue && !showRawValues) ||
          excludedRawValues.some((v) => cssVar.name === v)
        ) {
          return false;
        }
        if (propertyFilter === 'all') {
          return true;
        }
        return mustBeColor(cssVar);
      }),
    }));
  }, [unfilteredGroups, propertyFilter, search, filteredSelectors]);

  return (
    <Fragment>
      {tutorial}
      <ul className={`group-list ${texturedTree ? 'textured-tree' : ''}`}>
        {groups.length === 0 && (
          <li>
            <span className="alert">No element selected</span>
          </li>
        )}
        {groups.map((group, index) => (
          <GroupControl key={group.label} {...{ group, index }} />
        ))}
      </ul>
    </Fragment>
  );
}

Inspector.fName = 'Inspector';