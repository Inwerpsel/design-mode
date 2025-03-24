import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
  useId,
} from 'react';
import {ThemeEditorContext} from '../ThemeEditor';
import { allStateSelectorsRegexp, residualNotRegexp } from '../../functions/getMatchingVars';
import { get, use } from '../../state';
import { toNode, toPath } from '../../functions/nodePath';
import { addHighlight, removeHighlight } from '../../functions/highlight';
import { getGroupsForElement } from '../../initializeThemeEditor';
import { focusInspectedGroup } from '../ResizableFrame';

function removeStateSelectors(selector) {
  return selector
    .replaceAll(allStateSelectorsRegexp, '')
    .replaceAll(/:?:(before|after)/g, '')
    .replaceAll(residualNotRegexp, '')
  .trim()
}

let lastInspectedSelector, lastHighlightTimeout;

function viewHighLightSingle(element, scrollOptions = {behavior: 'smooth', block: 'center'}) {
  element.scrollIntoView(scrollOptions);
  addHighlight(element);
  if (lastHighlightTimeout) {
    const [timeout, handler, timeoutElement] = lastHighlightTimeout;

    window.clearTimeout(timeout);
    // If previous timeout was on another element, execute it immediately.
    // Removes its focus border.
    if (timeoutElement !== element) {
      handler();
    }
  }
  const handler = () => {
    removeHighlight(element);
    lastHighlightTimeout = null;
  };

  lastHighlightTimeout = [setTimeout(handler, 1500), handler, element];
}

let lastScroll = 0;

export function ElementLocator({
  selector,
  hideIfNotFound,
  hideIfOne,
  children,
  showLabel = true,
  property = null,
  label,
  allowScroll = false,
  allowDrag = true,
  instant = false,
}) {
  const { frameLoaded, openFirstOnInspect } = get;

  const [inspectedPath, setInspectedPath] = use.inspectedPath();
  const [, setOpenGroups] = use.openGroups();

  const strippedSelector = useMemo(() => removeStateSelectors(selector), []);
  const didLastInspectHere = strippedSelector === lastInspectedSelector;
  const { frameRef } = useContext(ThemeEditorContext);

  const elements = useMemo(() => {
    if (!frameLoaded || strippedSelector === '') return [];
    try {
      const results =
        frameRef.current.contentWindow.document.querySelectorAll(
          strippedSelector
        );
      let inspectedNode;
      try {
        inspectedNode = toNode(inspectedPath, frameRef.current.contentWindow.document);
      } catch (e) {
      }
      return [...results].map((el, index) => ({
        index,
        node: el,
        tagName: `${el.tagName}`,
        id: `${el.id}`,
        className: `${el.className}`,
        isCurrentlyInspected: el.contains(inspectedNode),
      }));
    } catch (e) {
      console.log(e);
      return [];
    }
  }, [selector, frameLoaded, inspectedPath]);

  const [currentElement, setCurrentElement] = useState(
    Math.max(elements.findIndex((el) => el.isCurrentlyInspected),  0)
  );

  if (elements.length === 0) {
    if (hideIfNotFound || hideIfOne) {
      return null;
    }
    return (
      <div style={{ opacity: 0.6 }}>
        {showLabel && (
          <div
            className="monospace-code"
            draggable={allowDrag}
            // draggable
            onDragStart={(e) => e.dataTransfer.setData('selector', selector)}
          >
            {(label || selector).trim()}
            <span className={'var-control-property monospace-code'}>
              {property}
            </span>
          </div>
        )}

        {children}
      </div>
    );
  }

  if (hideIfOne && elements.length === 1) {
    // If the locator is shown in the context of a selected element,
    // it should be the same one if it's the only result.
    return null;
  }

  const element = elements[currentElement];

  function scrollElements(event) {
    const now = performance.now();
    const isFast = now - lastScroll < 100;
    lastScroll = now;
    const stepSize = Math.round(event.deltaY / 100) * -1;
    const afterStep = currentElement - stepSize;
    const next =
      afterStep < 0
        // Stepped below 0
        ? afterStep + elements.length
        : afterStep >= elements.length
        // Stepped above amount of elements
        ? afterStep - elements.length
        : afterStep;
    setCurrentElement(next);
    const element = elements[next];
    if (instant) {
      setInspectedPath(toPath(element.node));
      if (openFirstOnInspect) {
        const groups = getGroupsForElement(element.node)
        setOpenGroups(
          {
            [groups[0].label]: true,
          },
          { skipHistory: true, appendOnly: true }
        );
      }
    } else {
      viewHighLightSingle(element.node, {behavior: isFast ? 'instant' : 'smooth', block: 'center'});
    }
    // event.preventDefault();
    // event.stopPropagation();
  }
  
  return (
    <div
      style={{
        outline: didLastInspectHere ? '4px solid rgb(26, 217, 210)' : 'none',
      }}
      onWheelCapture={allowScroll ? scrollElements : null}
    >
      {showLabel && (
        <div className="monospace-code"
            style={{maxHeight: '5rem', overflowY: 'auto'}}
            draggable={allowDrag}
            // draggable
            onDragStart={e=>{
              e.dataTransfer.setData('selector', selector);
              e.stopPropagation();
            }}
        >
          {(label || selector).trim()}
          <span className={'var-control-property monospace-code'}>
            {property}
          </span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '372px',
          fontSize: '16px',
        }}
      >
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row' }}>
          {elements.length > 0 && (
            <button
              className="scroll-in-view"
              onClick={() => {
                viewHighLightSingle(elements[currentElement].node);
              }}
            >
              👁
            </button>
          )}

          {elements.length > 1 && (
            <Fragment>
              <button
                onClick={() => {
                  const next =
                    currentElement === 0
                      ? elements.length - 1
                      : currentElement - 1;
                  setCurrentElement(next);
                  if (instant) {
                    setInspectedPath(toPath(elements[next].node));
                  } else {
                    viewHighLightSingle(elements[next].node);
                  }
                }}
              >
                ↑
              </button>
              <button
                onClick={() => {
                  const next =
                    currentElement === elements.length - 1
                      ? 0
                      : currentElement + 1;
                  setCurrentElement(next);
                  if (instant) {
                    setInspectedPath(toPath(elements[next].node));
                  } else {
                    viewHighLightSingle(elements[next].node);
                  }
                }}
              >
                ↓
              </button>
            </Fragment>
          )}
        </div>
        <div style={{ flexShrink: 1, height: '6rem' }}>
          {!!element && !element.isCurrentlyInspected && (
            <button
              onClick={() => {
                setInspectedPath(toPath(element.node));
                focusInspectedGroup();
                if (openFirstOnInspect) {
                  const groups = getGroupsForElement(element.node)
                  setOpenGroups(
                    {
                      [groups[0].label]: true,
                    },
                    { skipHistory: true, appendOnly: true }
                  );
                }
              }}
              style={{ fontSize: '10px' }}
            >
              🔍
            </button>
          )}
          <span>
            {currentElement + 1}/{elements.length}
          </span>
          <span
            style={{
              maxWidth: '120px',
              fontWeight:
                element && element.isCurrentlyInspected ? 'bold' : 'normal',
            }}
          >
            {element &&
              ` ${element.tagName.toLowerCase()}.${element.className
                .trim()
                .replaceAll(' ', '.')} ${!element.id ? '' : `#${element.id}`}`}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
