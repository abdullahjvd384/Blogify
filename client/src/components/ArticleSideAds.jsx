import { useEffect, useRef, useCallback } from 'react';

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

/**
 * Injects Adsterra's atOptions + invoke.js directly into the page DOM.
 *
 * Why not srcDoc iframes?
 *   srcDoc iframes have origin `null` and an empty document.referrer.
 *   Adsterra's invoke.js validates the publisher domain via referrer / location
 *   and silently refuses to serve ads when it can't identify the site.
 *   Direct injection runs in the real page context, so domain checks pass.
 */
function AdSlot({ adKey, height, width }) {
  const containerRef = useRef(null);
  const refreshTimer = useRef(null);

  const loadAd = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous ad content (for refresh)
    container.innerHTML = '';

    // Create the target div Adsterra writes into
    const target = document.createElement('div');
    target.id = `container-${adKey}`;
    container.appendChild(target);

    // Inject atOptions as a global (Adsterra reads window.atOptions)
    const optionsScript = document.createElement('script');
    optionsScript.textContent = `
      atOptions = {
        key: '${adKey}',
        format: 'iframe',
        height: ${height},
        width: ${width},
        params: {},
      };
    `;
    container.appendChild(optionsScript);

    // Load invoke.js — cache-bust with timestamp so refreshes pull fresh ads
    const invokeScript = document.createElement('script');
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js?t=${Date.now()}`;
    invokeScript.async = true;
    container.appendChild(invokeScript);
  }, [adKey, height, width]);

  useEffect(() => {
    loadAd();

    // Auto-refresh ads every 45 minutes
    refreshTimer.current = window.setInterval(loadAd, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshTimer.current);
      // Clean up injected scripts on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [loadAd]);

  return (
    <div
      ref={containerRef}
      style={{ minWidth: width, minHeight: height }}
    />
  );
}

export function ArticleSideAds({ adKey, height = 600, width = 160 }) {
  return (
    <div className="hidden self-stretch xl:block">
      <div className="sticky top-24 pt-10">
        <AdSlot adKey={adKey} height={height} width={width} />
      </div>
    </div>
  );
}
