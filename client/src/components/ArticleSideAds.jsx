import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;
let loadQueue = Promise.resolve();

function enqueueAdLoad(task) {
  loadQueue = loadQueue
    .then(() => task())
    .catch(() => {});
  return loadQueue;
}

function AdSlot({ adKey, height, width }) {
  const containerRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer = null;

    const renderAd = () =>
      enqueueAdLoad(
        () =>
          new Promise((resolve) => {
            const container = containerRef.current;
            const host = hostRef.current;
            if (!container || cancelled) {
              resolve();
              return;
            }

            container.innerHTML = '';
            if (host) {
              host.querySelectorAll('script').forEach((node) => node.remove());
            }

            const optionsScript = document.createElement('script');
            optionsScript.text = [
              'atOptions = {',
              `  key: '${adKey}',`,
              "  format: 'iframe',",
              `  height: ${height},`,
              `  width: ${width},`,
              '  params: {}',
              '};',
            ].join('\n');

            const invokeScript = document.createElement('script');
            invokeScript.async = false;
            invokeScript.dataset.cfasync = 'false';
            invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;

            let finished = false;
            const finish = () => {
              if (finished) return;
              finished = true;
              if (refreshTimer) window.clearTimeout(refreshTimer);
              resolve();
            };

            invokeScript.onload = finish;
            invokeScript.onerror = finish;

            if (host) {
              host.appendChild(optionsScript);
              host.appendChild(invokeScript);
            }

            refreshTimer = window.setTimeout(finish, 15000);
          }),
      );

    renderAd();
    const intervalId = window.setInterval(renderAd, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (hostRef.current) hostRef.current.querySelectorAll('script').forEach((node) => node.remove());
    };
  }, [adKey, height, width]);

  return (
    <div className="hidden self-start lg:block">
      <div className="sticky top-24 flex justify-center">
        <div ref={hostRef} className="flex flex-col items-center">
          <div
            ref={containerRef}
            id={`container-${adKey}`}
            className={cn(
              'overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60',
            )}
            style={{ width: `${width}px`, minHeight: `${height}px` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ArticleSideAds(props) {
  return <AdSlot {...props} />;
}