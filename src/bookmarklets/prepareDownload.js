javascript: void (() => {
  const removeElements = 'script, iframe, link:is([rel=preload], [rel=preconnect], [rel="dns-prefetch"])';
  try {
    [...document.querySelectorAll(removeElements)].forEach((e) =>
      e.parentNode.removeChild(e)
    );
    [...document.querySelectorAll('[srcset]')].forEach((e) => {
      e.dataset.srcset = e.srcset;
      e.removeAttribute('srcset');
    });
    const titleEl = document.createElement('title');
    titleEl.innerHTML = document.title;
    document.head.append(titleEl);
    document.title = 'index';
    [...document.querySelectorAll('style:empty')].forEach(s => {
      const text = [...s.sheet.rules].map(r=>r.cssText).join('');
      s.innerHTML = text;
    });
  } catch (e) {
    alert(e);
  }
})();
