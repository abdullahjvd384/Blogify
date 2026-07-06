import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Config ───────────────────────────────────────────────────────────
const REFRESH_MS = 45 * 1000; // re-request each visible ad every 45s
const SLOT_H = 600; // Adsterra 160x600 skyscraper
const SLOT_W = 160;
const GAP = 40; // vertical space between stacked ads
const TOP_PAD = 40; // aligns the first ad with the article's top padding
const MAX_SLOTS = 8; // safety cap per rail

// Two 160x600 Adsterra zones owned by DevCrunch. They are alternated down each
// rail (and offset between the left/right rails) so no two adjacent ad slots
// request the same zone — which keeps fill healthy when many are on screen.
const SIDE_AD_KEYS = [
  '066f1f55f129027cbafd0f9bb8a9f6e3',
  '1bf428af68e46e36796dee21ffb31b14',
];

// ─── One 160x600 ad, isolated in its own same-origin iframe ───────────
// The iframe points at /adsterra-frame.html (see client/public), which runs the
// canonical Adsterra embed in its own document. That sidesteps the global
// `window.atOptions` race that made stacking multiple banners unreliable.
function AdFrame({ adKey, index }) {
  const holder = useRef(null);
  const frame = useRef(null);
  const timer = useRef(null);
  const loaded = useRef(false);

  const srcFor = useCallback(
    () =>
      `/adsterra-frame.html?key=${adKey}&w=${SLOT_W}&h=${SLOT_H}&t=${Date.now()}-${index}`,
    [adKey, index],
  );

  useEffect(() => {
    const el = holder.current;
    if (!el) return undefined;

    // Lazy-load: only fetch an ad once its slot scrolls near the viewport, then
    // keep refreshing it (but only while it stays roughly on screen).
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || loaded.current) return;
        loaded.current = true;
        if (frame.current) frame.current.src = srcFor();
        timer.current = setInterval(() => {
          const near =
            el.getBoundingClientRect().top < window.innerHeight * 2 &&
            el.getBoundingClientRect().bottom > -window.innerHeight;
          if (frame.current && near) frame.current.src = srcFor();
        }, REFRESH_MS);
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearInterval(timer.current);
    };
  }, [srcFor]);

  return (
    <div
      ref={holder}
      style={{ width: SLOT_W, height: SLOT_H }}
      className="overflow-hidden rounded-lg"
    >
      <iframe
        ref={frame}
        title="Advertisement"
        width={SLOT_W}
        height={SLOT_H}
        scrolling="no"
        style={{
          display: 'block',
          width: SLOT_W,
          height: SLOT_H,
          border: 0,
          background: 'transparent',
        }}
      />
    </div>
  );
}

// ─── One rail (left or right) of stacked 160x600 ads ──────────────────
// The outer div uses `self-stretch` to fill the full grid-row height (matching
// the article column). The inner stack is absolutely positioned so its own
// height never feeds back into the grid row — that lets us measure the article's
// height and render exactly as many ads as fit, top to bottom.
export function ArticleSideAds({ side = 'left' }) {
  const wrapRef = useRef(null);
  const [count, setCount] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const compute = () => {
      const usable = el.clientHeight - TOP_PAD + GAP;
      const n = Math.max(1, Math.floor(usable / (SLOT_H + GAP)));
      setCount(Math.min(n, MAX_SLOTS));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Offset the key rotation by rail so left starts on zone A, right on zone B.
  const startIdx = side === 'right' ? 1 : 0;

  return (
    <div
      ref={wrapRef}
      className="relative hidden self-stretch xl:block"
      style={{ width: SLOT_W }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 flex flex-col items-center overflow-hidden"
        style={{ gap: GAP, paddingTop: TOP_PAD }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <AdFrame
            key={i}
            index={i}
            adKey={SIDE_AD_KEYS[(startIdx + i) % SIDE_AD_KEYS.length]}
          />
        ))}
      </div>
    </div>
  );
}
