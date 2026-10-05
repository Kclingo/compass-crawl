import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Gift, MapPin, Ticket as TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StampGrid, { RaffleBadge } from '@/components/StampGrid';
import DonationReveal from '@/components/DonationReveal';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyTicket from '@/hooks/useMyTicket';
import useEventProviders from '@/hooks/useEventProviders';
import { formatEventDate, money } from '@/lib/compass';

export default function Home() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { ticket, stamps, pick, loading: ticketLoading } = useMyTicket(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);

  if (eventLoading || ticketLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  if (!event) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Compass className="mx-auto h-8 w-8 text-accent-strong" />
        <p className="mt-3 font-heading text-xl">No crawl scheduled yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Krystal adds the next event in the back office and it will show up here.
        </p>
      </div>
    );
  }

  const slots = eventProviders.map((ep) => ({
    id: ep.id,
    providerId: ep.provider_id,
    name: providersById[ep.provider_id]?.name || 'Provider',
  }));
  const stampedIds = new Set(stamps.map((s) => s.event_provider_id));
  const collected = slots.filter((s) => stampedIds.has(s.id)).length;
  const total = slots.length;
  const remaining = Math.max(total - collected, 0);
  const checkedIn = Boolean(ticket?.checked_in_at);
  const entered = total > 0 && collected === total;
  const progress = total ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-primary p-5 text-primary-foreground">
        <p className="text-[11px] uppercase tracking-[0.25em] text-secondary">
          {event.awareness_theme || 'Community wellness night'}
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight">{event.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/80">
          <MapPin className="h-4 w-4" /> {formatEventDate(event.date)} · {event.venue}
        </p>
        <p className="mt-4 font-heading text-base italic text-secondary">
          Collect conversations, not just contacts.
        </p>
      </section>

      {!ticket && (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">Your passport is waiting</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Grab a ticket, pick where your {money(event.donation_amount)} goes, then check in at the door.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/tickets/new">
              <TicketIcon className="mr-2 h-4 w-4" /> Get your ticket · from {money(event.early_bird_price)}
            </Link>
          </Button>
        </section>
      )}

      {ticket && !checkedIn && (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="flex items-center gap-2 font-heading text-xl">
            <CheckCircle2 className="h-5 w-5 text-accent-strong" /> Ticket confirmed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan the check-in sign at the entrance, or tap below if you&rsquo;re already there.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to={`/check-in?event=${event.id}`}>
              Check in <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      )}

      {ticket && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="font-heading text-xl uppercase tracking-[0.2em]">Your passport</p>
            <RaffleBadge entered={entered} />
          </div>

          {checkedIn ? (
            <>
              <div className="mt-4">
                <StampGrid slots={slots} stampedIds={stampedIds} />
              </div>
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {collected} of {total} stamps
                  {remaining > 0
                    ? ` · ${remaining} more to enter the raffle`
                    : ' · every stamp collected, you\u2019re in the raffle'}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Your {total} stamp circles fill in as you visit each provider table tonight.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button asChild variant="outline">
              <Link to="/schedule">Showcase times</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/providers">Providers</Link>
            </Button>
          </div>
        </section>
      )}

      {ticket && (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="flex items-center gap-2 font-heading text-xl">
            <Gift className="h-5 w-5 text-accent-strong" /> Your {money(event.donation_amount)} donation
          </p>
          {pick ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Going to the nonprofit you picked. You can change it until check-in closes.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Pick which of tonight&rsquo;s nonprofits receives your {money(event.donation_amount)}.
            </p>
          )}
          <Button asChild variant={pick ? 'outline' : 'default'} className="mt-4 w-full">
            <Link to="/charity">{pick ? 'Change my pick' : 'Choose a nonprofit'}</Link>
          </Button>
        </section>
      )}

      {checkedIn && (event.feedback_open || event.status === 'closed') && (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">How was tonight?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fully anonymous, takes a minute, and helps the next crawl.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/feedback">Share feedback</Link>
          </Button>
        </section>
      )}

      {(event.feedback_open || event.status === 'closed') && <DonationReveal event={event} />}
    </div>
  );
}