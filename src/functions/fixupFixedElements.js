export function clearFixedStickyCache() {
    if (fixedCache) for (const el of fixedCache) {
        restoreOrigTransform(el);
    }
    if (stickyCache) for (const el of stickyCache) {
        restoreOrigTransform(el);
    }
    triedFixed = 0, triedSticky = 0;
    fixedCache = null;
    stickyCache = null;
    // origTransforms = new WeakMap();
    origTop = new WeakMap();
    origComputedTop = new WeakMap();
    origScale = new WeakMap();
    containerEnd = new WeakMap();
}

// Todo (some done but with issues):
// - Fix sometimes incorrect caching: for some reason some examples first get detected as fixed, then as sticky
// - Collect height added by previous sticky elements, and push following sticky elements down by that amount
// - Determine end of parent and don't push sticky elements inside of it beyond that
// - Detect fixed elements positioned relative to bottom of page,
//   and correct them to be relative to bottom of selected frame
// - Sync the scroll position of deeper elements between both frames.
//   Common case is sticky sidebar menu with many items.
// - Account for existing `transform` on elements: don't replace but adjust the values.

// Some pages rely on trying several times before fixed or sticky elements are picked up.
// Could be styles added later, nodes added later, or classes being changed.
// We're try this many times whenever the list was empty.
// Just a quick fix though, this has to be more robust.
const MAX_TRIES = 20;
let triedFixed = 0, triedSticky = 0;

let fixedCache;
export function getFixedElements(document) {
    if (fixedCache?.length === 0) {
        if (triedFixed >= MAX_TRIES) {
            return [];
        }
        triedFixed++;
    }
    if (fixedCache && fixedCache.length > 0) {
        return fixedCache;
    }
    // console.log('FIXED not using cache');
    const elements = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'fixed');
    fixedCache = elements.filter(el => !elements.some(other => other !== el && other.contains(el)));

    return fixedCache;
}

let stickyCache;

function isInFixedElement(el, fixedElements) {
    let ancestor = el.parentNode;
    while (ancestor) {
        if (fixedElements.includes(ancestor)) {
            return true;
        }
        ancestor = ancestor.parentNode;
    }
    return false;
}

export function getStickyElements(document, fixedElements) {
    if (stickyCache?.length === 0) {
        triedSticky++;
        if (triedSticky === MAX_TRIES) {
            return [];
        }
    }
    if (stickyCache && stickyCache.length > 0) {
        return stickyCache;
    }
    // console.log('STICKY not using cache');
    const elements = [...document.querySelectorAll('*')].filter(
      (el) => 
        getComputedStyle(el).position === 'sticky' 
        && !isInFixedElement(el, fixedElements)
    );
    stickyCache = elements;

    return elements;
}

const transition = 'transform .1s ease-out';

const fixedHeight = new WeakSet();
const position = new WeakMap();

export function fixupFixedElements(elements, scrollOffset, sticky, screenHeight, windowHeight) {
    const changes = [];

    for (const el of elements) {
        const scrollDone = (sticky.some(s=>s.contains(el)));
        let bottomCorrection = 0;
        const isCached = position.has(el);
        const {bottom, top} = isCached ? position.get(el) : getComputedStyle(el);
        if (!isCached) {
            // console.log('computed style for fixed', el);
            position.set(el, {bottom, top});
        }
        // if (height === '0px') {
        //     continue;
        // }
        if (parseInt(top.replace('px', '')) > screenHeight && parseInt(bottom.replace('px', '')) < screenHeight)  {
            bottomCorrection = windowHeight - screenHeight;
        }
        if (!origTransforms.has(el)) {
            origTransforms.set(el, el.style.transform);
        }
        if (!fixedHeight.has(el)) {
            fixedHeight.add(el);
            changes.push(() => {
                // el.style.maxHeight = `calc(var(--real-height, ${screenHeight}) * 1px)`
                el.style.transition = transition;
                // el.style.willChange = 'transform';
            });
        }

        const pushedAmount = (scrollDone ? 0 : scrollOffset) - bottomCorrection; 

        changes.push(() => {
            // el.style.transform = `translateY(${pushedAmount}px)`;
        });
    }
    for (const change of changes) {
        change();
    }

    // return () => {

    // };
}

const origTransforms = new WeakMap();
function restoreOrigTransform(el) {
    const orig = origTransforms.get(el);
    if (el.style.transform !== orig) {
        // console.log('restore', el);
        el.style.transform = orig;
    }
}

let origTop = new WeakMap();
let origComputedTop = new WeakMap();
let origScale = new WeakMap();
let containerEnd = new WeakMap();
let heights = new WeakMap();

export function fixupStickyElements(elements, scrollOffset) {
    const changes = [];
    // console.log('sticky', elements);
    const pushedElements = new WeakSet();

    for (const el of elements) {
        // if (el.offsetHeight === 0) {
        //     continue;
        // }
        let insideMoved = false;

        let ancestor = el.parentNode;
        while (ancestor) {
            if (pushedElements.has(ancestor)) {
                insideMoved = true;
                break;
            }
            ancestor = ancestor.parentNode;
        }

        if (!origTransforms.has(el)) {
            origTransforms.set(el, el.style.transform);
            changes.push(() => {
                el.style.transition = transition;
                el.style.position = 'static';
            });
        }
        if (!origTop.has(el)) {
            const s = getComputedStyle(el);
            // console.log(el, `${el.getBoundingClientRect().top}`, scrollOffset)
            origTop.set(el, el.getBoundingClientRect().top);
            origComputedTop.set(el, parseInt(s.top.replace('px', '') || 0));
            let scale = 1;
            if (s.transform.startsWith('matrix3d(')) {
                // const firstComma = s.transform.indexOf(',');
                scale = parseFloat(s.transform.replace(/^matrix3d\(/, '').replace(/,.*/, ''));
                console.log('scale', scale);
                if (scale !== 1) {
                    origScale.set(el, scale);
                }
            }
            let container = el.parentNode, parentStyle;
            while (parentStyle = getComputedStyle(container), s.display === 'contents' || s.display === '') {
                // Special case where the container acts as though it's not there.
                // As a result, we need to use its parent to calculate available space.
                container = container.parentNode;
                if (container.nodeName === 'BODY') {
                    break;
                }
            }

            if (container.parentNode.nodeName === 'TABLE') {
                container = container.parentNode;
            }
            const paddingBottom = parseFloat(parentStyle.paddingBottom.replace('px', '')) * scale;
            containerEnd.set(el, container.getBoundingClientRect().bottom - paddingBottom);
        }

        const scale = origScale.get(el) || 1; // screw elements with scale 0 for now
        const computedTop = origComputedTop.get(el) * ( scale);

        if (insideMoved) {
            continue;
        }

        let scaleCorrection = 0;
        if (scale !== 1) {
            // Assuming the transformorigin is in the center for now.
            const elHeight = el.getBoundingClientRect().height;
            scaleCorrection = elHeight * (1 - scale) / 2;
        }

        // height * (1- scale) / 2

        const elStart = origTop.get(el) - scaleCorrection;

        if ((scrollOffset + computedTop) < elStart) {
            changes.push(() => {
                restoreOrigTransform(el);
            });
            continue;
        }
        const end = containerEnd.get(el);
        const hasHeight = heights.has(el);
        const elHeight = hasHeight ? heights.get(el) : el.getBoundingClientRect().height / scale;
        if (!hasHeight) {
            heights.set(el, elHeight);
        }
        const maxOffset =  end - elHeight - elStart;

        if (scrollOffset > end) {
            changes.push(() => {
                restoreOrigTransform(el);
            });
            continue;
        }

        const pushedAmount = Math.min(maxOffset, scrollOffset - elStart + computedTop);
        // console.log({maxOffset, scrollOffset ,elStart ,computedTop, calc: scrollOffset - elStart + computedTop});
        if (pushedAmount > 0) {
            pushedElements.add(el);
        }

        changes.push(() => {
            const origTransform = origTransforms.get(el);
            // console.log('transform!!!!!!!!!', el);
            el.style.transform = `translateY(${pushedAmount}px) ${origTransform.replace(/translateY\([^\(]*\)/, '')}`;
        });

        // Below is a stab at syncing fixed/sticky elements internal scroll position.
        // This is quite common, for example sticky menus of documentation sites.

        // const emitOwnScroll = (event) => {
        //     const path = toPath(event.target);
        //     const y = event.target.scrollY;
        //     console.log(path,y);
        // }

        // const elInOtherFrame = toNode(
        //   toPath(el, frameRef.current.contentWindow.document),
        //   frameRef.current.contentWindow.document
        // );
        // if (!elInOtherFrame) continue;

        // if (listener.has(el)) {
        //     elInOtherFrame.removeEventListener('scroll', listener.get(el));
        //     listener.delete(el);
        // }
        // elInOtherFrame.addEventListener('scroll', emitOwnScroll);
        // listener.set(el, emitOwnScroll);
    }

    for (const change of changes) {
        change();
    }
}