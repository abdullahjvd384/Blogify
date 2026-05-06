import { useEffect, useRef } from 'react';
import { env } from '@/env';

const HEARTBEAT_INTERVAL_MS = 15_000;
const IDLE_THRESHOLD_MS = 60_000;

/**
 * Tracks a logged-in reader's time-on-article.
 *
 * Lifecycle:
 *   1. on mount → POST /reads/start
 *   2. every 15s while page is visible AND user is "active" → POST /reads/heartbeat
 *   3. on unmount, tab hide, or pagehide → POST /reads/end (fetch + keepalive
 *      so the request survives navigation away)
 *
 * "Active" means there's been a mousemove / scroll / keystroke in the last 60s.
 * Quietly idling on a page does NOT inflate watch time — heartbeats pause and
 * the per-beat server-side cap clamps any backlog when activity resumes.
 *
 * In dev React strict mode triggers an extra mount/unmount cycle so you'll see
 * start → end → start in the network tab. That's expected and harmless: the
 * server simply opens a fresh Redis session each time.
 */
export function useReadTracker({ articleId, enabled = true } = {}) {
  const lastActivityAt = useRef(Date.now());
  const startedAt = useRef(null);

  useEffect(() => {
    if (!enabled || !articleId) return undefined;

    const apiUrl = (path) => `${env.apiBaseUrl}${path}`;

    async function call(path, body) {
      try {
        const res = await fetch(apiUrl(path), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok;
      } catch {
        return false;
      }
    }

    /**
     * `keepalive` lets the request finish even after the page unloads. Modern
     * replacement for navigator.sendBeacon — supports credentialed CORS and
     * JSON bodies, which sendBeacon doesn't.
     */
    function callKeepalive(path, body) {
      try {
        fetch(apiUrl(path), {
          method: 'POST',
          credentials: 'include',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }

    function bumpActivity() {
      lastActivityAt.current = Date.now();
    }

    async function sendStart() {
      if (startedAt.current) return;
      const ok = await call('/reads/start', { articleId });
      if (ok) startedAt.current = Date.now();
    }

    async function sendHeartbeat() {
      if (!startedAt.current) return;
      if (document.hidden) return;
      if (Date.now() - lastActivityAt.current > IDLE_THRESHOLD_MS) return;
      await call('/reads/heartbeat', { articleId });
    }

    function sendEnd() {
      if (!startedAt.current) return;
      callKeepalive('/reads/end', { articleId });
      startedAt.current = null;
    }

    function onVisibility() {
      if (document.hidden) sendEnd();
      else sendStart();
    }

    sendStart();
    const beatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((e) =>
      window.addEventListener(e, bumpActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', sendEnd);

    return () => {
      activityEvents.forEach((e) => window.removeEventListener(e, bumpActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', sendEnd);
      clearInterval(beatTimer);
      sendEnd();
    };
  }, [articleId, enabled]);
}
