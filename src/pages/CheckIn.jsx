import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import BackLink from '@/components/BackLink';
import useMyTicket from '@/hooks/useMyTicket';
import { formatEventDate, formatClock } from '@/lib/compass';

export default function CheckIn() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('event');
  const { event: current, loading: currentLoading } = useCurrentEvent();
  const [event, setEvent] = useState(null);
  const { ticket, loading: ticketLoading, reload } = useMyTicket(event?.id);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (requestedId) {
      base44.entities.Event.get(requestedId).then(setEvent);
    } else if (current) {
      setEvent(current);
    }
  }, [requestedId, current]);

  useEffect(() => {
    base44.auth
      .me()
      .then((user) => setIsAdmin(user?.role === 'admin'))
      .catch(() => {});
  }, []);

  async function markArrived() {
    setMarking(true);
    await base44.entities.Ticket.update(ticket.id, { checked_in_at: new Date().toISOString() });
    await reload();
    setMarking(false);
  }

  async function runSearch() {
    if (!search.trim() || !event) return;
    const page = await base44.entities.Ticket.filter(
      { event_id: event.id, status: 'active', attendee_name: { $regex: search.trim(), $options: 'i' } },
      { limit: 10 }
    );
    setResults(page.items);
  }

  async function markGuest(row) {
    await base44.entities.Ticket.update(row.id, { checked_in_at: new Date().toISOString() });
    runSearch();
  }

  if (currentLoading || ticketLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">That crawl isn&rsquo;t available.</p>;

  return (
    <div className="space-y-5">
      <BackLink to="/" label="My passport" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Check in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEventDate(event.date)} · doors from {formatClock(event.start_time)}
        </p>
      </div>

      {!ticket && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">No ticket under this account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy a ticket with this email and the passport unlocks right after check-in.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/tickets/new">Get your ticket</Link>
          </Button>
        </div>
      )}

      {ticket && ticket.checked_in_at && (
        <div className="rounded-lg border border-accent/40 bg-card p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-2 font-heading text-xl">You&rsquo;re in, {ticket.attendee_name.split(' ')[0]}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Checked in at {new Date(ticket.checked_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
            Your passport is unlocked.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/">Open my passport</Link>
          </Button>
        </div>
      )}

      {ticket && !ticket.checked_in_at && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">Mark me as arrived</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {ticket.attendee_name}. Grab food, browse the providers, and go to whichever showcases catch
            your eye.
          </p>
          <Button className="mt-4 w-full" onClick={markArrived} disabled={marking}>
            {marking ? 'Checking you in…' : 'Check in now'}
          </Button>
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
                  <span className="block truncate text-sm">{row.attendee_name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{row.email}</span>
                </span>
                {row.checked_in_at ? (
                  <span className="text-xs text-accent">Arrived</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markGuest(row)}>
                    Mark arrived
                  </Button>
                )}
              </li>
            ))}
            {search && !results.length && (
              <li className="text-xs text-muted-foreground">No matching guests.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}