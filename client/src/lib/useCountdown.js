import { useEffect, useState } from 'react';

/**
 * Returns the human-formatted time remaining until `target` (an ISO string or
 * Date). Re-renders once per second; emits "00:00:00" once the target is
 * reached and keeps it there until the consumer changes the target.
 */
export function useCountdown(target) {
  const compute = () => msUntil(target);
  const [ms, setMs] = useState(compute);

  useEffect(() => {
    setMs(compute());
    const t = setInterval(() => setMs(compute()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target instanceof Date ? target.getTime() : target]);

  return formatHMS(ms);
}

function msUntil(target) {
  if (!target) return 0;
  const t = target instanceof Date ? target.getTime() : Date.parse(target);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, t - Date.now());
}

function formatHMS(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
