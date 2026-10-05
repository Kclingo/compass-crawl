import React, { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyTicket from '@/hooks/useMyTicket';
import useEventProviders from '@/hooks/useEventProviders';
import { combineDateTime, formatClock } from '@/lib/compass';

export default function ShowcaseAlert() {
  const { event } = useCurrentEvent();
  const { ticket } = useMyTicket(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [reminders, setReminders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!ticket) {
      setReminders([]);
      return;
    }
    base44.entities.Reminder.filter({ ticket_id: ticket.id, status: 'pending' }, { limit: 50 }).then((page) =>
      setReminders(page.items)
    );
  }, [ticket]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!event || !ticket || !ticket.checked_in_at) return null;

  const savedIds = new Set(reminders.map((r) => r.event_provider_id));
  const due = eventProviders.find((ep) => {
    if (dismissed.includes(ep.id)) return false;
    if (!ticket.remind_all && !savedIds.has(ep.id)) return false;
    const start = combineDateTime(event.date, ep.showcase_time);
    if (!start) return false;
    const minutes = Math.round((start.getTime() - now) / 60000);
    return minutes <= 5 && minutes >= -1;
  });

  if (!due) return null;

  const provider = providersById[due.provider_id];
  const start = combineDateTime(event.date, due.showcase_time);
  const minutes = Math.max(Math.round((start.getTime() - now) / 60000), 0);

  return (
    <div className="mx-auto mt-3 flex max-w-2xl items-start gap-3 rounded-lg border border-accent bg-secondary px-4 py-3 text-secondary-foreground">
      <BellRing className="mt-0.5 h-5 w-5 text-accent-strong" />
      <div className="flex-1 text-sm">
        <p className="font-medium">
          {minutes <= 0 ? 'Starting now' : `In ${minutes} min`} · {provider?.name}
        </p>
        <p className="text-xs">
          {due.showcase_title || 'Showcase'} at {formatClock(due.showcase_time)}
          {due.table_number ? ` · Table ${due.table_number}` : ''}
        </p>
      </div>
      <button type="button" onClick={() => setDismissed((d) => [...d, due.id])} aria-label="Dismiss reminder">
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}