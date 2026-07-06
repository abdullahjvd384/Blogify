import { useCallback, useEffect, useRef } from 'react';

// Adsterra "Native Banner" — a responsive in-content ad. Unlike the 160x600
// iframe banners, this one is loaded from the effectivecpmnetwork CDN and paints
// itself into a container div matched by id (`container-<key>`). It must NOT use
// atOptions / highperformanceformat — that combination (previously in index.html)
// silently failed because the key is a native zone, not an iframe zone.
const REFRESH_MS = 45 * 1000; // re-request a fresh creative every 45s
const KEY = '7c15f74b7a924b109feaa15377a398ef';
const SRC = `https://pl30219227.effectivecpmnetwork.com/${KEY}/invoke.js`;

/** In-article native banner. Renders nothing until Adsterra fills the slot. */
export function NativeBanner({ className }) {
  const host = useRef(null);
  const timer = useRef(null);

  // (Re)paint the banner: wipe the host, recreate a fresh container, then load a
  // cache-busted invoke.js so each cycle pulls a new ad.
  const load = useCallback(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = '';

    // The container must exist before invoke.js runs, so append it first.
    const container = document.createElement('div');
    container.id = `container-${KEY}`;
    el.appendChild(container);

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `${SRC}?t=${Date.now()}`;
    el.appendChild(script);
  }, []);

  useEffect(() => {
    const el = host.current;
    load(); // initial load
    timer.current = setInterval(load, REFRESH_MS); // refresh every 45s
    return () => {
      clearInterval(timer.current);
      if (el) el.innerHTML = '';
    };
  }, [load]);

  return (
    <div className={className}>
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Advertisement
      </p>
      <div ref={host} className="flex min-h-[90px] justify-center" />
    </div>
  );
}
