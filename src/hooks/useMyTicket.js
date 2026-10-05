import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useMyTicket(eventId) {
  const [ticket, setTicket] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    const user = await base44.auth.me();
    const { items } = await base44.entities.Ticket.filter(
      { event_id: eventId, created_by_id: user.id, status: 'active' },
      { sort: '-created_date', limit: 1 }
    );
    const mine = items[0] || null;
    setTicket(mine);
    if (mine) {
      const [stampPage, pickPage] = await Promise.all([
        base44.entities.Stamp.filter({ ticket_id: mine.id }, { limit: 100 }),
        base44.entities.CharityPick.filter({ ticket_id: mine.id }, { limit: 1 }),
      ]);
      setStamps(stampPage.items);
      setPick(pickPage.items[0] || null);
    } else {
      setStamps([]);
      setPick(null);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { ticket, stamps, pick, loading, reload };
}