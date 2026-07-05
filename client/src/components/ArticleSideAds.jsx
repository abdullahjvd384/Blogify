import { useEffect, useRef, useCallback } from 'react';

const REFRESH_MS = 45 * 1000; // 45 seconds

// ─── Sequential ad loader ─────────────────────────────────────────────
// Adsterra's invoke.js reads the global `window.atOptions` on execution.
// If two ad slots set atOptions and append invoke.js at the same time,
// the second write overwrites the first before invoke.js runs — one ad
// silently gets the wrong key and fails.  This queue guarantees only
// one invoke.js loads and executes at a time.
let chain = Promise.resolve();

function enqueueAd(container, adKey, height, width) {
  chain = chain.then(
    () =>
      new Promise((resolve) => {
        // 1. Create the container div Adsterra writes into
        const target = document.createElement('div');
        target.id = `container-${adKey}`;
        container.appendChild(target);

        // 2. Set atOptions immediately before invoke.js
        window.atOptions = {
          key: adKey,
          format: 'iframe',
          height,
          width,
          params: {},
        };

        // 3. Load invoke.js — resolve on load OR error so the queue never stalls
        const script = document.createElement('script');
        script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js?t=${Date.now()}`;
        script.onload = resolve;
        script.onerror = resolve;
        container.appendChild(script);
      }),
  );
  return chain;
}

// ─── Single ad slot ───────────────────────────────────────────────────
function AdSlot({ adKey, height, width }) {
  const ref = useRef(null);
  const timer = useRef(null);

  const load = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = ''; // clear previous ad content
    enqueueAd(el, adKey, height, width);
  }, [adKey, height, width]);

  useEffect(() => {
    load(); // initial load
    timer.current = setInterval(load, REFRESH_MS); // refresh every 45s
    return () => {
      clearInterval(timer.current);
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [load]);

  return (
    <div
      ref={ref}
      style={{ minWidth: width, minHeight: height }}
    />
  );
}

// ─── Exported wrapper (one per side of the article) ──────────────────
// The outer div uses `self-stretch` to fill the full grid-row height
// (matching the article column), so the inner `sticky` element can
// follow the reader from top to bottom as they scroll.
export function ArticleSideAds({ adKey, height = 600, width = 160 }) {
  return (
    <div className="hidden self-stretch xl:block">
      <div className="sticky top-24 pt-10">
        <AdSlot adKey={adKey} height={height} width={width} />
      </div>
    </div>
  );
}
