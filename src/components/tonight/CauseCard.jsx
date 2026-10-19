import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isCheckInClosed, money } from '@/lib/compass';

export default function CauseCard({ event, pick, charity }) {
  const locked = isCheckInClosed(event);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-heading text-xl">
        <HeartHandshake className="h-5 w-5 text-accent-strong" /> Your cause
      </p>
      {charity ? (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{charity.name}</span>
          {pick?.amount ? ` · ${money(pick.amount)} gifted here` : ''}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Pick one of this month&rsquo;s four causes. You can change it until check-in closes.
        </p>
      )}
      <Button asChild variant={charity ? 'outline' : 'default'} className="mt-4 w-full" disabled={locked}>
        <Link to="/cause">{charity ? (locked ? 'Cause locked in' : 'Change my cause') : 'Choose my cause'}</Link>
      </Button>
      {locked && <p className="mt-2 text-xs text-muted-foreground">Check-in has closed, so this is locked.</p>}
    </section>
  );
}