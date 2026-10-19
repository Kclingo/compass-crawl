import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import SmsPreferenceCard from '@/components/me/SmsPreferenceCard';
import MyProvidersCard from '@/components/me/MyProvidersCard';
import DeleteAccountCard from '@/components/me/DeleteAccountCard';
import { formatEventDate, isCheckInClosed, isFeedbackOpen, money } from '@/lib/compass';

export default function Me() {
  const { event, loading } = useCurrentEvent();
  const { attendee, pick, loading: passLoading, reload } = useMyPass(event?.id);
  const [charity, setCharity] = useState(null);
  const [savingText, setSavingText] = useState(false);

  const loadCharity = useCallback(async () => {
    if (!pick?.charity_id) {
      setCharity(null);
      return;
    }
    setCharity(await base44.entities.Charity.get(pick.charity_id));
  }, [pick?.charity_id]);

  useEffect(() => {
    loadCharity();
  }, [loadCharity]);

  async function toggleText(next) {
    setSavingText(true);
    await base44.entities.Attendee.update(attendee.id, {
      text_opt_in: next,
      text_opt_in_at: next ? new Date().toISOString() : '',
    });
    await reload();
    setSavingText(false);
  }

  async function deleteAccount() {
    await base44.entities.CharityPick.deleteMany({ attendee_id: attendee.id });
    await base44.entities.Reminder.deleteMany({ attendee_id: attendee.id });
    await base44.entities.Demographic.deleteMany({ attendee_id: attendee.id });
    const user = await base44.auth.me();
    await base44.entities.SavedProvider.deleteMany({ user_id: user.id });
    await base44.entities.Attendee.delete(attendee.id);
    await base44.auth.logout();
  }

  if (loading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">The next Crawl is being planned.</p>;

  if (!attendee) {
    return (
      <div className="space-y-5">
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Me</h1>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">No pass yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your details live here once you claim a pass.</p>
          <Button asChild className="mt-4 w-full">
            <Link to="/pass/new">Claim my free pass</Link>
          </Button>
        </div>
      </div>
    );
  }

  const locked = isCheckInClosed(event);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Me</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.title} · {formatEventDate(event.date)}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">{attendee.full_name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{attendee.email}</p>
        <p className="text-sm text-muted-foreground">{attendee.mobile}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-accent-strong">
          {attendee.status === 'waitlist'
            ? 'Waitlist'
            : attendee.checked_in_at
              ? 'Checked in'
              : 'Pass confirmed'}
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="flex items-center gap-2 font-heading text-xl">
          <HeartHandshake className="h-5 w-5 text-accent-strong" /> Cause and gift
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {charity ? charity.name : 'No cause picked yet.'}
          {attendee.gift_status === 'paid'
            ? ` · ${money(attendee.gift_amount)} gifted through Therapy Hour & Co.`
            : ''}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline" disabled={locked}>
            <Link to="/cause">{charity ? 'Change my cause' : 'Pick my cause'}</Link>
          </Button>
          {attendee.gift_status === 'paid' ? (
            <Button asChild variant="outline">
              <Link to="/pass">See my receipt details</Link>
            </Button>
          ) : (
            <Button asChild disabled={attendee.status === 'waitlist'}>
              <Link to="/gift">Give {money(event.gift_suggested_amount || 5)}</Link>
            </Button>
          )}
        </div>
        {locked && <p className="mt-2 text-xs text-muted-foreground">Check-in has closed, so your cause is locked.</p>}
      </section>

      <SmsPreferenceCard attendee={attendee} onToggle={toggleText} busy={savingText} />

      <MyProvidersCard />

      {attendee.checked_in_at && isFeedbackOpen(event) && (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">How was tonight?</p>
          <p className="mt-1 text-sm text-muted-foreground">Anonymous, four questions, about a minute.</p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/feedback">Share feedback</Link>
          </Button>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">Privacy</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This is a wellness social, not care. We never ask about your health and we never store clinical notes.
        </p>
      </section>

      <DeleteAccountCard onDelete={deleteAccount} />
    </div>
  );
}