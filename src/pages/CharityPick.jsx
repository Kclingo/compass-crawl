import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import BackLink from '@/components/BackLink';
import useMyTicket from '@/hooks/useMyTicket';
import { money } from '@/lib/compass';
import { cn } from '@/lib/utils';

export default function CharityPick() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { ticket, pick, loading: ticketLoading, reload } = useMyTicket(event?.id);
  const [charities, setCharities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    base44.entities.Charity.filter({ active: true }, { sort: 'sort_order', limit: 20 }).then((page) =>
      setCharities(page.items)
    );
  }, []);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId || !event?.id) return;
    base44.functions
      .invoke('confirmTicketPayment', { session_id: sessionId })
      .then((response) => {
        if (response.data?.status === 'paid') setPaid(true);
        return reload();
      })
      .finally(() => window.history.replaceState({}, '', '/charity'));
  }, [event?.id, reload]);

  if (eventLoading || ticketLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl">Grab your ticket first</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your donation pick comes right after you get your ticket.
        </p>
        <Button asChild className="mt-4">
          <Link to="/tickets/new">Get your ticket</Link>
        </Button>
      </div>
    );
  }

  const locked = Boolean(ticket.checked_in_at);

  async function choose(charity) {
    setSaving(true);
    if (pick) {
      await base44.entities.CharityPick.update(pick.id, { charity_id: charity.id });
    } else {
      await base44.entities.CharityPick.create({
        event_id: event.id,
        ticket_id: ticket.id,
        charity_id: charity.id,
        amount: event.donation_amount ?? 5,
      });
    }
    await reload();
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <BackLink to="/" label="My passport" />
      {paid && (
        <p className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          <CheckCircle2 className="h-4 w-4 text-accent" /> Payment received. Now pick where your donation goes.
        </p>
      )}
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Where should it go?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your {money(event?.donation_amount)} goes to one of tonight&rsquo;s nonprofits.
          {locked ? ' Check-in has closed your pick.' : ' You can change this until check-in closes.'}
        </p>
      </div>

      <div className="space-y-3">
        {charities.map((charity) => {
          const selected = pick?.charity_id === charity.id;
          return (
            <button
              key={charity.id}
              type="button"
              disabled={saving || locked}
              onClick={() => choose(charity)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition',
                selected ? 'border-accent ring-1 ring-accent' : 'border-border'
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg text-secondary">
                {charity.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg leading-tight">{charity.name}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{charity.description}</span>
              </span>
              {selected && <Check className="mt-1 h-5 w-5 shrink-0 text-accent" />}
            </button>
          );
        })}
      </div>

      <Button asChild className="w-full" variant={pick ? 'default' : 'outline'}>
        <Link to="/">{pick ? 'Go to my passport' : 'I’ll pick later'}</Link>
      </Button>
    </div>
  );
}