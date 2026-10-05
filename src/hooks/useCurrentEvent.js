import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCurrentEvent() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { items } = await base44.entities.Event.list({ sort: 'date', limit: 100 });
      if (!active) return;
      const today = new Date().toISOString().slice(0, 10);
      const live = items.find((e) => e.status === 'live');
      const upcoming = items.find((e) => e.date >= today);
      const past = [...items].reverse().find((e) => e.date < today);
      setEvent(live || upcoming || past || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { event, loading };
}