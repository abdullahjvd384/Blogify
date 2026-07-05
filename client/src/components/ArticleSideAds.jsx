import { useEffect, useMemo, useState } from 'react';

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

function buildAdSrcDoc(adKey, height, width) {
  const containerId = `container-${adKey}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }
      body {
        width: ${width}px;
        min-height: ${height}px;
      }
      #${containerId} {
        width: ${width}px;
        min-height: ${height}px;
      }
    </style>
  </head>
  <body>
    <div id="${containerId}"></div>
    <script>
      atOptions = {
        key: '${adKey}',
        format: 'iframe',
        height: ${height},
        width: ${width},
        params: {},
      };
    </script>
    <script src="https://www.highperformanceformat.com/${adKey}/invoke.js"></script>
  </body>
</html>`;
}

function AdSlot({ adKey, height, width }) {
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, []);

  const srcDoc = useMemo(() => buildAdSrcDoc(adKey, height, width), [adKey, height, width]);

  return (
    <iframe
      key={refreshTick}
      title={`Advertisement ${adKey}`}
      srcDoc={srcDoc}
      width={width}
      height={height}
      scrolling="no"
      loading="lazy"
      className="block border-0"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}

export function ArticleSideAds() {
  return (
    <div className="hidden self-stretch xl:block">
      <div className="sticky top-24 flex flex-col gap-6 pt-10">
        <AdSlot adKey="066f1f55f129027cbafd0f9bb8a9f6e3" height={600} width={160} />
        <AdSlot adKey="1bf428af68e46e36796dee21ffb31b14" height={600} width={160} />
      </div>
    </div>
  );
}
