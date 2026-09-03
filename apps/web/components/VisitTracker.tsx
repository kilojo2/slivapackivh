'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export function VisitTracker() {
  useEffect(() => {
    try {
      fetch(`${API_URL}/stats/track`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}