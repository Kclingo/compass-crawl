import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import BackLink from '@/components/BackLink';
import { formatClock, formatEventDate, isCheckInClosed, isEventNight } from '@/lib/compass';

export default function CheckIn() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('event');
  const { event: current, loading: currentLoading } = useCurrentEvent();
  const [event, setEvent] = useState(null);
  const { attendee, loading: passLoading, reload } = useMyPass(event?.id);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (requestedId) base44.entities.Event.get(requestedId).then(setEvent);
    else if (current) setEvent(current);
  }, [requestedId, current]);

  useEffect(() => {
    base44.auth
      .me()
      .then((user) => setIsAdmin(user?.role === 'admin'))
      .catch(() => {});
  }, []);

  async function markArrived() {
    setMarking(true);
    await base44.entities.Attendee.update(attendee.id, { checked_in_at: new Date().toISOString() });
    await reload();
    setMarking(false);
  }

  async function runSearch() {
    if (!search.trim() || !event) return;
    const page = await base44.entities.Attendee.filter(
      { event_id: event.id, status: 'active', full_name: { $regex: search.trim(), $options: 'i' } },
      { limit: 10 }
    );
    setResults(page.items);
  }

  async function markGuest(row) {
    await base44.entities.Attendee.update(row.id, { checked_in_at: new Date().toISOString() });
    runSearch();
  }

  if (currentLoading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">That Crawl isn&rsquo;t available.</p>;

  const closed = isCheckInClosed(event);
  const checkedInAt = attendee?.checked_in_at
    ? new Date(attendee.checked_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-5">
      <BackLink to="/" label="Tonight" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Check in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEventDate(event.date)} · doors from {formatClock(event.start_time)}
          {event.check_in_closes_at ? ` · check-in closes ${formatClock(event.check_in_closes_at)}` : ''}
        </p>
      </div>

      {!attendee && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">No pass under this account</p>
          <p className="mt-1 text-sm text-muted-foreground">Claim your free pass and this unlocks.</p>
          <Button asChild className="mt-4 w-full">
            <Link to="/pass/new">Claim my free pass</Link>
          </Button>
        </div>
      )}

      {attendee?.status === 'waitlist' && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">You&rsquo;re on the waitlist</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.waitlist_message || 'This Crawl is full. Join the list for next month.'}
          </p>
        </div>
      )}

      {attendee?.status === 'active' && checkedInAt && (
        <div className="rounded-lg border border-accent bg-card p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-accent-strong" />
          <p className="mt-2 font-heading text-xl">You&rsquo;re in, {attendee.full_name.split(' ')[0]}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Checked in at {checkedInAt}
            {isEventNight(event) ? ' · you are all set for tonight.' : '.'}
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/">Open Tonight</Link>
          </Button>
        </div>
      )}

      {attendee?.status === 'active' && !checkedInAt && (
        <div className="rounded-lg border border-border bg-card p-5">
          {closed ? (
            <>
              <p className="flex items-center gap-2 font-heading text-xl">
                <Lock className="h-5 w-5 text-accent-strong" /> Check-in has closed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask the greeter at the door to check you in from the host screen.
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-xl">Mark me as arrived</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome, {attendee.full_name}. One tap and tonight is open to you.
              </p>
              <Button className="mt-4 w-full" onClick={markArrived} disabled={marking}>
                {marking ? 'Checking you in…' : 'Check in now'}
              </Button>
            </>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Greeter fallback</p>
          <div className="mt-2 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a guest by name"
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Button variant="outline" onClick={runSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {results.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{row.full_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
                </span>
                {row.checked_in_at ? (
                  <span className="text-xs text-accent-strong">Arrived</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markGuest(row)}>
                    Mark arrived
                  </Button>
                )}
              </li>
            ))}
            {search && !results.length && <li className="text-xs text-muted-foreground">No matching guests.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}