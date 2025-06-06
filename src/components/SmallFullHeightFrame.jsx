import React, { Fragment, useContext, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { get, use } from '../state';
import { ThemeEditorContext } from './ThemeEditor';
import { clearFixedStickyCache, fixupFixedElements, fixupStickyElements, getFixedElements, getStickyElements } from '../functions/fixupFixedElements';
import { useResumableLocalStorage } from '../hooks/useLocalStorage';
import { Checkbox, Checkbox2 } from './controls/Checkbox';
import { useCompactSetting } from './movable/MovableElement';
import { CompactModeButton } from './movable/CompactModeButton';

const wrapperMargin = 28;

const vhRegex = /(-?\d+(\.\d+)?)(d|s)?vh/;

function replaceVhInStylemap(style, initialHeight) {
  const replacedRules = [];

  for (const decl of style.cssText.split(';')) {
    if (decl.trim() === '') continue;
    const firstSemicolon = decl.indexOf(':');
    const property = decl.substring(0, firstSemicolon).trim();
    const value = decl.substring(firstSemicolon + 1).trim();
    // console.log(property, value);
    // const value = style.getPropertyValue(property);
    if (!value.includes('vh')) continue;
    let newValue = value, match;

    while (match = newValue.match(vhRegex)) {
      const n = match[1];
      const replacement = `calc(${n / 100}px * var(--real-height, ${initialHeight}))`;
      newValue = newValue.replace(vhRegex, replacement);
    }
    if (newValue !== value) {
      style.setProperty(property, newValue);
      replacedRules.push([property, value, newValue]);
    }
  }
  return replacedRules;
}

export function vhToCalc(root, initialHeight) {
  const start = performance.now();
  const results = [];

  const elsUsingStyle = root.querySelectorAll('[style*="vh"]');

  for (const el of elsUsingStyle) {
    const value = el.style.cssText;
    let newValue = value, match;
    while (match = newValue.match(vhRegex)) {
      const n = match[1];
      const replacement = `calc(${n / 100}px * var(--real-height, ${initialHeight}))`;
      newValue = newValue.replace(vhRegex, replacement);
    }
    if (value === newValue) {
      continue;
    }
    el.style = newValue;
  }

  for (const sheet of root.styleSheets) {
    if (sheet?.ownerNode?.attributes?.href?.value === '../../dist/main.css') continue;
    for (const rule of sheet.rules) {
      if (!rule.cssText.includes('vh')) continue;
      if (rule.style) {
        const resultsForRule = replaceVhInStylemap(rule.style, initialHeight);
        if (resultsForRule.length > 0) {
          results.push([rule.selectorText, resultsForRule]);
        }
      };
      if (rule.type !== 4 && rule.type !== 12) continue;
      for (const innerRule of rule.cssRules) {
        if (innerRule.style) {
          const resultsForRule = replaceVhInStylemap(innerRule.style, initialHeight);
          if (resultsForRule.length > 0) {
            results.push([innerRule.selectorText, resultsForRule]);
          }
        }
      }
    }
  }

  results.push(performance.now() - start);

  return results;
}

function FocusFrame({cursorRef, scrollPosition, maxHeight, scale}) {
  const { inspectedPath } = get;

  useEffect(() => {
    const y = scale * (scrollPosition - maxHeight * 2) ;
    cursorRef.current?.parentNode.scrollTo({left: 0, top: y, behavior: 'smooth'});
  }, [
    inspectedPath,
    scrollPosition,
    scale,
  ]);

}

export function SmallFullHeightFrame(props) {
  const { src } = props;
  const {
    width,
    height,
    frameLoaded,
    fullHeightFrameScale: userScale,
    fullHeightFrameShowFixed,
    fullHeightFrameFixVh,
    fullHeightFrameAutoScale,
    fullHeightFrameCalculatedScale,
  } = get;
  const { frameRef, scrollFrameRef } = useContext(ThemeEditorContext);

  const [scrollPosition, setScrollPosition] = useState(0);
  const [windowDragged, setWindowDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(0);
  const [scrollAtStartDrag, setScrollAtStartDrag] = useState(0);
  const [ownPosition, setOwnPosition] = useState(null);
  const [shouldSmoothScroll, setShouldSmoothScroll] = useState(false);
  const [windowHeight, setWindowHeight] = use.windowHeight();
  const cursorRef = useRef();

  const scale = (fullHeightFrameAutoScale && windowHeight > height) ? fullHeightFrameCalculatedScale : userScale;
  const frameHeight = windowHeight * scale;
  const maxHeight = windowHeight * fullHeightFrameCalculatedScale;
  const inverseScale = 1 / scale;
  const centerFrame = scale * (scrollPosition - maxHeight * 2);

  useInsertionEffect(() => {
    if (fullHeightFrameAutoScale) {
      cursorRef.current?.parentNode.scrollTo(0,0);
    } else {
      cursorRef.current?.parentNode.scrollTo(0, centerFrame);
    }
  }, [fullHeightFrameAutoScale]);

  useEffect(() => {
    if (ownPosition !== null) {
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'force-scroll',
          payload: { position: ownPosition, shouldSmoothScroll },
        },
        window.location.origin
      );
    }
  }, [ownPosition]);

  useEffect(() => {
    const win = scrollFrameRef.current.contentWindow;

    if (fullHeightFrameFixVh) {
      win.addEventListener('load', () => {
        win.document.documentElement.classList.add('dofullheight')
        win.document.documentElement.style.setProperty('--real-height', height);
        vhToCalc(win.document, height);
      })
    }

    const listener = ({ data: { type, payload } }) => {
      if (type === 'frame-scrolled') {
        setScrollPosition(payload.scrollPosition);
        setOwnPosition(null);
      }
    };

    setTimeout(() => {
      window.addEventListener('message', listener);
      frameRef.current?.contentWindow.postMessage(
        {
          type: 'emit-scroll',
        },
        window.location.origin
      );
      return () => {
        window.removeEventListener('message', listener);
      };
    }, 1000);
  }, []);

  useEffect(() => {
    const doc = scrollFrameRef.current.contentWindow.document;
    const fixed = getFixedElements(doc); 
    const sticky = getStickyElements(doc, fixed); 
    if (!fullHeightFrameShowFixed) {

      for (const el of [...fixed, ...sticky]) {
        el.classList.add('hide-important');
      }

      return;
    } else {
      //unhide
      for (const el of [...fixed, ...sticky]) {
        el.classList.remove('hide-important');
      }
    }
  }, [fullHeightFrameShowFixed]);

  useEffect( () => {
    if (!frameLoaded) return;
    setWindowHeight(frameRef.current.contentWindow.document.body.parentNode.scrollHeight);
    const timeout = setTimeout(() => {
      setWindowHeight(frameRef.current.contentWindow.document.body.parentNode.scrollHeight);
      // Give some time for possible animations that affect the height.
      // It seems a lot but for the Bootstrap masonry demo it's barely enough.
    }, 800);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [frameLoaded, width, height]);

  useInsertionEffect(() => {
    clearFixedStickyCache();
  }, [windowHeight]);

  let last = 0;
  useLayoutEffect(() => {
    if (!fullHeightFrameShowFixed) {
      return;
    }
    const now = performance.now();
    if (now - last > 50) {
      const doc = scrollFrameRef.current.contentWindow.document;
      const fixed = getFixedElements(doc); 
      const sticky = getStickyElements(doc, fixed); 

      last = now;

      fixupStickyElements(sticky, scrollPosition);
      fixupFixedElements(fixed, scrollPosition, sticky, height, windowHeight);
    }
  }, [scrollPosition, width, height, fullHeightFrameShowFixed])

  const top =
    Math.max(
      0,
      (windowDragged ? ownPosition || scrollPosition : scrollPosition) * scale
    );

  const applyDragDelta = (event) => {
    if (windowDragged) {
      setOwnPosition(
        scrollAtStartDrag - (dragStartPos - event.clientY) * inverseScale
      );
      setShouldSmoothScroll(false);
    }
  };

  const jumpFrame = (e) => {
    // Quick fix using parentNode.
    const diff = e.clientY - top - scrollFrameRef.current.parentNode.getBoundingClientRect().top;
    setOwnPosition(Math.max(0, scrollPosition + diff * inverseScale - (height / 2)));
    setShouldSmoothScroll(false);
  };

  if (windowHeight === 0) {
    return null;
  }


  return (
    // <div style={{maxHeight: '80vh', border: '1px solid pink'}}>
    // </div>
    (<div
      id={'fullHeightFrame'}
      style={{
        display: windowHeight === null ? 'none' : 'block',
        position: 'relative',
        width: 20 + width * scale,
        maxWidth: 20 + width * scale,
        height: frameHeight + 20,
        maxHeight,
        overflowY: frameHeight > maxHeight ? 'scroll' : 'hidden',
        overflowX: 'hidden',
      }}
    >
      {!windowDragged && !fullHeightFrameAutoScale && (frameHeight > maxHeight) && <FocusFrame key={windowDragged} {...{scale, cursorRef, scrollPosition,ownPosition, maxHeight }} />}
      <div
        className="responsive-frame-container"
        style={{
          transform: `scale(${scale})`,
          width: `${wrapperMargin + width}px`,
          maxHeight: `${wrapperMargin + windowHeight * scale}px`,
          overflow: 'visible',
          //   padding: '0',
          //   boxSizing: 'border-box',
        }}
      >
        <div
          onMouseDown={jumpFrame}
          onMouseUp={() => setWindowDragged(false)}
          onMouseMove={applyDragDelta}
          style={{
            zIndex: 1,
            height: windowHeight,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />
        <iframe
          className="responsive-frame"
          ref={scrollFrameRef}
          {...{
            src,
            width,
            height: Math.max(height, windowHeight),
            // Possibly width was set with a CSS rule, which prevents the regular attribute,
            // from working. Add it as a CSS attribute too to prevent this.
            // This is a byproduct of loading arbitrary CSS in the editor.
            style: {width},
          }}
        />
      </div>
      <span
        ref={cursorRef}
        onClick={jumpFrame}
        onMouseDown={(event) => {
          setWindowDragged(true);
          setDragStartPos(event.clientY);
          setScrollAtStartDrag(scrollPosition);
        }}
        onMouseMove={applyDragDelta}
        onMouseUp={() => setWindowDragged(false)}
        style={{
          userSelect: 'none',
          zIndex: 2,
          top,
          // left: `calc(4px * ${scale})`,
          position: 'absolute',
          display: 'inline-block',
          outline: '4px solid oklch(40.10% 0.2213 301.68)',
          // outlineOffset: '1px',
          width: width * scale,
          height: height * scale,
          transition: 'top .05s ease-out',
          boxSizing: 'content-box',
          visibility: windowDragged ? 'hidden' : ''
        }}
      />
    </div>)
  );
}

export function ToggleableSmallFullHeightFrame() {
  if (!get.fullHeightFrame) return null;

  return <SmallFullHeightFrame src={window.location.href} />;
}

export function FullHeightFrameScale() {
  const [value, setValue] = use.fullHeightFrameScale();
  const [doAutoScale, setDoAutoScale] = use.fullHeightFrameAutoScale();
  const [showFixed, setShowFixed] = use.fullHeightFrameShowFixed();
  const [step, setStep] = useResumableLocalStorage('fullheightframescalestep', '0.01');
  const [compact] = useCompactSetting();
  const {fullHeightFrame: on, fullHeightFrameCalculatedScale} = get;

  return (
    <div style={{display: 'flex'}}>
      {!compact && <Fragment>
        <input
          type="number"
          style={{
            maxWidth: '72px',
            backgroundColor: doAutoScale ? 'oklch(91.80% 0.046 287.60)' : 'white',
          }}
          {...{
            value: doAutoScale ? fullHeightFrameCalculatedScale : value,
            step,
            onChange: (event) => {
              setDoAutoScale(false);
              setValue(event.target.value);
            },
          }}
        />
        <label>
          step
          <input
            type="number"
            style={{
              maxWidth: '72px',
            }}
            {...{
              value: step,
              onChange: (event) => {
                setStep(event.target.value);
              },
            }}
          />
        </label>
        <Checkbox controls={[showFixed, setShowFixed]}>Show fixed and sticky</Checkbox>
      </Fragment>}
      {on &&<Checkbox controls={[doAutoScale, setDoAutoScale]} >Auto scale</Checkbox>}
      {(!on || !compact) && 
        <Checkbox2
          hook={use.fullHeightFrame}
          title='WARNING!!! 1) Affects performance on large pages 2) If scrollable section is below body, it cannot be fully shown (e.g. Halfmoon) 3) Does not work properly for pages that have different styles based on screen height.'
        >Full height preview</Checkbox2>}
      <CompactModeButton />
    </div>
  );
}

FullHeightFrameScale.fName = 'FullHeightFrameScale'