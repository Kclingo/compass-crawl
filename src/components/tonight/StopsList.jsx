import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatClock } from '@/lib/compass';

export default function StopsList({ event, eventProviders, providersById, attendee }) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!attendee) {
      setCount(0);
      return;
    }
    const total = await base44.entities.Reminder.count({ attendee_id: attendee.id, status: 'pending' });
    setCount(total);
  }, [attendee]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-heading text-xl">Tonight&rsquo;s stops</p>
        <Link to="/schedule" className="text-xs uppercase tracking-[0.15em] text-accent-strong">
          Schedule
        </Link>
      </div>

      {attendee && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          {count > 0
            ? `${count} reminder${count === 1 ? '' : 's'} set · in-app, 5 minutes before each showcase`
            : 'Set a reminder for any showcase on the Schedule tab.'}
        </p>
      )}

      <ul className="mt-4 divide-y divide-border border-t border-border">
        {eventProviders.map((ep) => (
          <li key={ep.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <Link to={`/providers/${ep.provider_id}`} className="block truncate text-sm font-medium">
                {providersById[ep.provider_id]?.name || 'Provider'}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {ep.showcase_title || 'Showcase'}
                {ep.table_number ? ` · Table ${ep.table_number}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-sm text-accent-strong">{formatClock(ep.showcase_time)}</span>
          </li>
        ))}
        {!eventProviders.length && (
          <li className="py-4 text-sm text-muted-foreground">
            <MapPin className="mr-2 inline h-4 w-4" /> The provider line-up is posted before the night.
          </li>
        )}
      </ul>
    </section>
  );
}