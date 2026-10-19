import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// The signed-in guest's pass for one event, plus the cause they picked.
export default function useMyPass(eventId) {
  const [attendee, setAttendee] = useState(null);
  const [pick, setPick] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!eventId) {
      setAttendee(null);
      setPick(null);
      setLoading(false);
      return;
    }
    const user = await base44.auth.me();
    const [byUser, byOwner] = await Promise.all([
      base44.entities.Attendee.filter({ event_id: eventId, user_id: user.id }, { limit: 5 }),
      base44.entities.Attendee.filter({ event_id: eventId, created_by_id: user.id }, { limit: 5 }),
    ]);
    const merged = [...byOwner.items, ...byUser.items].filter(
      (row, index, all) => all.findIndex((r) => r.id === row.id) === index
    );
    const mine = merged.find((a) => a.status !== 'cancelled') || null;
    setAttendee(mine);

    if (mine) {
      const picks = await base44.entities.CharityPick.filter({ attendee_id: mine.id }, { limit: 1 });
      setPick(picks.items[0] || null);
    } else {
      setPick(null);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { attendee, pick, loading, reload };
}