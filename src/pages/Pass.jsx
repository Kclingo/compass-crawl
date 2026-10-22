import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, HeartHandshake, QrCode } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import BackLink from '@/components/BackLink';
import StepHint from '@/components/StepHint';
import { downloadIcs, formatClock, formatEventDate, money } from '@/lib/compass';

export default function Pass() {
  const navigate = useNavigate();
  const { event, loading } = useCurrentEvent();
  const { attendee, pick, loading: passLoading, reload } = useMyPass(event?.id);
  const [charity, setCharity] = useState(null);
  const [giftNote, setGiftNote] = useState(false);

  useEffect(() => {
    if (!pick?.charity_id) {
      setCharity(null);
      return;
    }
    base44.entities.Charity.get(pick.charity_id).then(setCharity);
  }, [pick?.charity_id]);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) return;
    base44.functions
      .invoke('confirmGiftPayment', { session_id: sessionId })
      .then((response) => {
        if (response.data?.paid) setGiftNote(true);
        return reload();
      })
      .finally(() => window.history.replaceState({}, '', '/pass'));
  }, [reload]);

  useEffect(() => {
    if (!loading && !passLoading && event && !attendee) navigate('/pass/new', { replace: true });
  }, [loading, passLoading, event, attendee, navigate]);

  if (loading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event || !attendee) return null;

  return (
    <div className="space-y-5">
      <BackLink to="/" label="Tonight" />

      {giftNote && (
        <p className="flex items-center gap-2 rounded-lg border border-accent bg-secondary p-3 text-sm text-secondary-foreground">
          <HeartHandshake className="h-4 w-4 text-accent-strong" /> Your gift is in. Stripe emails the receipt.
        </p>
      )}

      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">You&rsquo;re in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Keep this screen. It&rsquo;s your pass for the night.</p>
      </div>

      <StepHint current={3} />

      <section className="rounded-lg bg-primary p-6 text-primary-foreground">
        <p className="text-[11px] uppercase tracking-[0.25em] text-secondary">
          {event.awareness_theme || 'Compass Crawl'}
        </p>
        <p className="mt-2 font-heading text-2xl uppercase tracking-[0.12em]">{attendee.full_name}</p>
        <dl className="mt-4 space-y-2 text-sm text-primary-foreground/85">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-secondary">When</dt>
            <dd>
              {formatEventDate(event.date)}
              {event.start_time ? ` · ${formatClock(event.start_time)}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-secondary">Where</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-secondary">Your cause</dt>
            <dd>{charity ? charity.name : 'Not picked yet'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-secondary">Your gift</dt>
            <dd>
              {attendee.gift_status === 'paid'
                ? `${money(attendee.gift_amount)} to ${charity ? charity.name : 'your cause'}`
                : 'Not given yet, and never required'}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={() => downloadIcs(event)}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Add to calendar
        </Button>
        <Button asChild size="lg">
          <Link to={`/check-in?event=${event.id}`}>
            <QrCode className="mr-2 h-4 w-4" /> Check in at the door
          </Link>
        </Button>
      </div>

      {attendee.gift_status !== 'paid' && attendee.status === 'active' && (
        <Button asChild variant="outline" className="w-full">
          <Link to="/gift">Add a gift to {charity ? charity.name : 'my cause'}</Link>
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Change your cause any time until check-in closes, from Tonight or Me.
      </p>
    </div>
  );
}