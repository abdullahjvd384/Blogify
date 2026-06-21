import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Set VITE_GA_ID (e.g. "G-XXXXXXXXXX") in the build env to enable Google
// Analytics 4. When unset, this component does nothing — zero overhead.
const GA_ID = import.meta.env.VITE_GA_ID;

let loaded = false;
function ensureGtag(id) {
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // We send page_view manually on route change (SPA), so disable the auto one.
  window.gtag('config', id, { send_page_view: false });
}

/** Loads GA4 (if configured) and reports a page_view on every SPA route change. */
export function Analytics() {
  const location = useLocation();
  useEffect(() => {
    if (!GA_ID) return;
    ensureGtag(GA_ID);
    window.gtag?.('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);
  return null;
}
