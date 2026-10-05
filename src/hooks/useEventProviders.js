import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useEventProviders(eventId) {
  const [eventProviders, setEventProviders] = useState([]);
  const [providersById, setProvidersById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const [epPage, providerPage] = await Promise.all([
        base44.entities.EventProvider.filter(
          { event_id: eventId, is_active: true },
          { sort: 'showcase_order', limit: 20 }
        ),
        base44.entities.Provider.list({ limit: 200 }),
      ]);
      if (!active) return;
      const map = {};
      providerPage.items.forEach((p) => {
        map[p.id] = p;
      });
      setEventProviders(epPage.items);
      setProvidersById(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  return { eventProviders, providersById, loading };
}