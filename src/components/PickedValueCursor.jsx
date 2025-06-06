import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { use } from '../state';
import { ThemeEditorContext } from './ThemeEditor';

let pageXOffset = 0;
let pageYOffset = 0;

export function PickedValueCursor() {
  const { frameRef, scrollFrameRef, xrayFrameRef } =
    useContext(ThemeEditorContext);
  const [pickedValue, setPickedValue] = use.pickedValue();
  const ref = useRef();

  const empty = pickedValue === '';

  useEffect(() => {
    if (empty) {
      return;
    }

    function positionElement(e) {
      if (!ref.current) return;
      const x = e.clientX;
      const y = e.clientY;

      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function positionElementInFrame(e) {
      if (!ref.current) return;
      const x = e.screenX - pageXOffset;
      const y = e.screenY - pageYOffset;

      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    let span = document.createElement('span');
    span.addEventListener('mouseenter', (event) => {
      ref.current.style.opacity = 1;
      ref.current.removeChild(span);
      pageXOffset = event.screenX - event.clientX;
      pageYOffset = event.screenY - event.clientY;
      positionElement(event);
    });
    span.style.position = 'fixed';
    span.style.top = 0;
    span.style.right = 0;
    span.style.bottom = 0;
    span.style.left = 0;
    ref.current.style.opacity = 0;
    ref.current.appendChild(span);

    window.addEventListener('mousemove', positionElement);

    if (frameRef.current) {
        frameRef.current.contentWindow.addEventListener('mousemove', positionElementInFrame);
    }
    if (scrollFrameRef.current) {
        scrollFrameRef.current.contentWindow.addEventListener('mousemove', positionElementInFrame);
    }
    if (xrayFrameRef.current) {
        xrayFrameRef.current.contentWindow.addEventListener('mousemove', positionElementInFrame);
    }

    return () => {
      window.removeEventListener('mousemove', positionElement);
      frameRef.current.contentWindow.removeEventListener('mousemove', positionElementInFrame);
      scrollFrameRef.current?.contentWindow.removeEventListener('mousemove', positionElementInFrame);
      xrayFrameRef.current?.contentWindow.removeEventListener('mousemove', positionElementInFrame);
    };
  }, [empty]);

  useLayoutEffect(() => {
    if (empty) {
      return;
    }
    const l = (e) => {
      if (
        !e.target.closest(
          '.movable-element, .area > *, #fullHeightFrame, #drawer-wrapper'
        )
      ) {
        setPickedValue('');
        e.stopPropagation();
      }
    };
    document.addEventListener('click', l);

    return () => {
      document.removeEventListener('click', l);
    };
  }, [empty]);

  if (empty) {
    return;
  }

  return (
    <div
      {...{ ref }}
      style={{ '--picked-value': pickedValue }}
      className='picked-cursor'
    >
      {pickedValue.length < 60 ? pickedValue : ''}
    </div>
  );
}
