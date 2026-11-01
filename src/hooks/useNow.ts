import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every `intervalMs` (default: one minute), so texts like
 * "Hoy" or "Podés cancelar hasta las 17:00" never go stale while the screen is open.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
