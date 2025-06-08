import React, {createContext, useContext, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AreasContext, DRAG_LEAVE_TIMEOUT} from './MovablePanels';
import {AreaSwitcher} from './AreaSwitcher';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import classnames from 'classnames';
import { onLongPress } from '../../functions/onLongPress';

export const MovableElementContext = createContext({});

// Current best attempt at generating a stable ID.
//
// It always works because it defaults to the index within the home area,
// however that's not resilient to changes in the source code order.
// For that to work it also includes the home area in the ID,
// which makes moving any component to another area in source mess up the location map.
// Likely the ID logic should be flexible and configurable.
// Would be nice to use the component name, however this usually is not 
// preserved in the prod build. I'll investigate if it's desirable to
// make the code use it in prod anyway (impact on bundle size/perf in general, ease of config).
function getId(element, index) {
  // Assume string means a default DOM node.
  if (typeof element.type === 'string') {
    // Use ID or first class.
    return element.props.className?.split(' ')[0] || index;
  }

  // Default to the element's type, which is assumed to be unique.
  return `${element.type?.name || 'component'}#${element.id || index}`;
}

export function useCompactSetting() {
  const {elementId} = useContext(MovableElementContext);

  return useLocalStorage(`compact::${elementId}`, true);
}

export function MovableElement({homeAreaId, element, index}) {
  const {
    origLocationsRef,
    uiState,
    showMovers,
    movePanelTo,
    overElement, setOverElement,
    overArea, setOverArea,
    timeoutRef,
    draggedElement, setDraggedElement,
    dragEnabled,
    drawerOpen,
    areaRefs,
  } = useContext(AreasContext);

  const elementId = useMemo(
    () => {
      return element.type?.fName || element.props.id || `${homeAreaId}~~${getId(element, index)}`;
    },
    []
  );

  if (!origLocationsRef.current[elementId]) {
    origLocationsRef.current[elementId] = homeAreaId;
  }

  const [hostAreaId, order] = uiState.map[elementId] || [];
  // There are 3 cases where we want to render in its default place.
  // 1) Element wasn't moved.
  // 2) Element was moved to its home area.
  // 3) The host area doesn't exist yet. A new render will get triggered after all areas have been rendered.
  const showHere = !hostAreaId || hostAreaId === homeAreaId || !areaRefs.current[hostAreaId]?.current;

  const [isDragged, setIsDragged] = useState(false);
  // Allow dragging individually if not generally enabled in MovablePanels.
  const [forceDrag, setForceDrag] = useState(false);

  const context = useMemo(
    () => ({
      homeAreaId,
      elementId,
      hostAreaId,
      forceDrag,
      setForceDrag,
    }),
    [hostAreaId, forceDrag]
  );

  if (!drawerOpen && (hostAreaId || homeAreaId) === 'drawer') {
    return null;
  }

  const [overAreaId, overElementId] = overElement || [];
  const isDragHovered = overElementId === elementId;

  const draggable = dragEnabled || forceDrag;

  const wrappedElement = (
    <div
      {...{draggable}}
      style={{
        position: 'relative',
        order: order || null,
        // Use view transitions to animate moving elements in history.
        //
        // This "works" but is very taxing on performance, causes input delay or even missed inputs.
        // There are also some visual artifacts, like jittering, probably because it temporarily
        // fully renders overflowing elements.
        // Nevertheless, it performs ANY AMOUNT OF animations, at the same time, with a visually correct result.
        // 
        // It's only added on every element because, for now,
        // there are only 4 interactions with a view transition.
        // (reset uiLayout, choose saved uiLayout, navigate into an element, and pressing single history forward backward buttons)
        // In both cases, input discarding is not a big concern.
        // 
        // viewTransitionName: elementId === 'HistoryControls' ? null : elementId,
        viewTransitionName: elementId,
      }}
      // title={!dragEnabled ? null : elementId}
      className={classnames('movable-element', { 'is-dragged': isDragged })}
      {...onLongPress(showMovers ? () => setDraggedElement(elementId) : null)}
      onClick={draggedElement ? () => setDraggedElement(null) : null}
      onDragStart={() => {
        if (dragEnabled || forceDrag) {
          setDraggedElement(elementId);
          forceDrag && setForceDrag(false);
          setTimeout(() => {
            // Without timeout there's no drag element snapshot.
            setIsDragged(true);
          }, 0);
        }
      }}
      onDragEnd={() => {
        setDraggedElement(null);
        setIsDragged(false);
        if (overElement) {
          if (timeoutRef.current.element) {
            clearTimeout(timeoutRef.current.element);
            timeoutRef.current.element = null;
          }
          if (timeoutRef.current.area) {
            clearTimeout(timeoutRef.current.area);
            timeoutRef.current.area = null;
          }
          movePanelTo(elementId, overAreaId, overElementId);
          setOverElement(null);
          return;
        }
        if (overArea) {
          movePanelTo(elementId, overArea);
        }
      }}
    >
      {draggedElement && draggedElement !== elementId && (
        <span
          style={{
            color: 'lime',
            background: 'rgb(0 0 0 / 56%)',
            position: 'absolute',
            top: '0',
            fontSize: '12px',
            right: '0',
            zIndex: 1001,
            fontWeight: 'bold !important',
            textAlign: 'right',
            width: 'auto',
          }}
        >
          {elementId}
        </span>
      )}

      <MovableElementContext.Provider
        value={context}
      >
        {element}
      </MovableElementContext.Provider>

      {/* {showMovers && <AreaSwitcher {...{elementId, homeAreaId, hostAreaId}}/>} */}

      {draggedElement && draggedElement !== elementId && (
        <div
          style={{ zIndex: 1000 }}
          className={classnames('dropzone', {
            'drag-hovered': isDragHovered ,
          })}
          onClick={()=>{
            movePanelTo(draggedElement, hostAreaId, elementId);
            setDraggedElement(null);
          }}
          onDragEnter={() => {
            timeoutRef.current.lastEntered = elementId;
            if (timeoutRef.current.element) {
              clearTimeout(timeoutRef.current.element);
              timeoutRef.current.element = null;
            }
            setOverArea(null);
            setOverElement([
              hostAreaId || homeAreaId,
              elementId,
              order || index,
            ]);
          }}
          onDragLeave={() => {
            timeoutRef.current.element &&
              clearTimeout(timeoutRef.current.element);

            if (timeoutRef.current.lastEntered === elementId) {
              timeoutRef.current.element = setTimeout(() => {
                setOverElement(null);
              }, DRAG_LEAVE_TIMEOUT);
            }
          }}
        ></div>
      )}
    </div>
  );

  // Changing to another portal host will un- and then remount the component.
  return showHere
    ? wrappedElement
    : createPortal(wrappedElement, areaRefs.current[hostAreaId].current);
}
