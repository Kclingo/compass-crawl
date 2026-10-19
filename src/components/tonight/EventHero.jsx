import React from 'react';
import { CalendarDays, MapPin, User } from 'lucide-react';
import { formatEventDate, formatEventWindow } from '@/lib/compass';

export default function EventHero({ event }) {
  return (
    <section className="rounded-lg bg-primary p-6 text-primary-foreground">
      <p className="text-[11px] uppercase tracking-[0.25em] text-secondary">
        {event.awareness_theme || 'Community wellness night'}
      </p>
      <h1 className="mt-2 font-heading text-3xl uppercase leading-tight tracking-[0.12em]">{event.title}</h1>
      {event.description && (
        <p className="mt-3 font-tagline text-lg italic text-secondary">{event.description}</p>
      )}
      <div className="mt-4 space-y-1.5 text-sm text-primary-foreground/85">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date)} · {formatEventWindow(event)}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {event.venue}
        </p>
        {event.host && (
          <p className="flex items-center gap-2">
            <User className="h-4 w-4" /> Hosted by {event.host}
          </p>
        )}
      </div>
    </section>
  );
}