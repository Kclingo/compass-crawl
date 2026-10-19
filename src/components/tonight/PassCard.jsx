import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadIcs, formatEventDate } from '@/lib/compass';

export default function PassCard({ event, attendee }) {
  const checkedInAt = attendee.checked_in_at
    ? new Date(attendee.checked_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  if (attendee.status === 'waitlist') {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">You&rsquo;re on the list</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.waitlist_message || 'This Crawl is full. Join the list for next month.'} We&rsquo;ll email you first
          if a seat opens.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl leading-tight">
            {checkedInAt ? `You're in, ${attendee.full_name.split(' ')[0]}` : 'Your pass is confirmed'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {checkedInAt
              ? `Checked in at ${checkedInAt}.`
              : `${formatEventDate(event.date)} · ${event.venue}`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => downloadIcs(event)}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Add to calendar
        </Button>
        <Button asChild variant={checkedInAt ? 'outline' : 'default'}>
          <Link to={`/check-in?event=${event.id}`}>
            <Clock className="mr-2 h-4 w-4" />
            {checkedInAt ? 'My check-in' : 'Check in at the door'}
          </Link>
        </Button>
      </div>
    </section>
  );
}