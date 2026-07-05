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

function AdSlot({ adKey, height, width, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer = null;

    const renderAd = () =>
      enqueueAdLoad(
        () =>
          new Promise((resolve) => {
            const container = containerRef.current;
            if (!container || cancelled) {
              resolve();
              return;
            }

            container.innerHTML = '';

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
            invokeScript.async = true;
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

            container.appendChild(optionsScript);
            container.appendChild(invokeScript);

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
    };
  }, [adKey, height, width]);

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
        style={{ width: `${width}px`, minHeight: `${height}px` }}
      />
    </div>
  );
}

export function ArticleSideAds() {
  return (
    <div className="hidden xl:block">
      <div className="sticky top-24 flex flex-col gap-6 pt-10">
        <AdSlot
          adKey="066f1f55f129027cbafd0f9bb8a9f6e3"
          height={600}
          width={160}
        />
        <AdSlot
          adKey="1bf428af68e46e36796dee21ffb31b14"
          height={300}
          width={160}
        />
      </div>
    </div>
  );
}