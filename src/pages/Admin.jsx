import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import { cn } from '@/lib/utils';
import AdminEventsTab from '@/components/admin/AdminEventsTab';
import AdminCharitiesTab from '@/components/admin/AdminCharitiesTab';
import AdminProvidersTab from '@/components/admin/AdminProvidersTab';
import AdminTonightTab from '@/components/admin/AdminTonightTab';
import AdminGuestDesk from '@/components/admin/AdminGuestDesk';
import AdminFeedbackTab from '@/components/admin/AdminFeedbackTab';
import AdminDonationsTab from '@/components/admin/AdminDonationsTab';

const TABS = [
  { key: 'tonight', label: 'Tonight' },
  { key: 'providers', label: 'Providers' },
  { key: 'guests', label: 'Guests' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'giving', label: 'Giving' },
  { key: 'event', label: 'Event setup' },
  { key: 'charities', label: 'Charities' },
];

export default function Admin({ initialTab = 'tonight' }) {
  const { event: current } = useCurrentEvent();
  const { pathname } = useLocation();
  const [isAdmin, setIsAdmin] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [tab, setTab] = useState(initialTab);

  const loadEvents = useCallback(async () => {
    const { items } = await base44.entities.Event.list({ sort: 'date', limit: 100 });
    setEvents(items);
  }, []);

  useEffect(() => {
    base44.auth
      .me()
      .then((user) => setIsAdmin(user?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!events.length || eventId) return;
    const preferred = current && events.some((e) => e.id === current.id) ? current.id : events[events.length - 1].id;
    setEventId(preferred);
  }, [events, current, eventId]);

  async function createEvent() {
    const created = await base44.entities.Event.create({
      title: 'Compass Crawl',
      date: new Date().toISOString().slice(0, 10),
      venue: 'Central Park St. Pete',
      status: 'draft',
    });
    await loadEvents();
    setEventId(created.id);
    setTab('event');
  }

  if (isAdmin === null) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">Back office is for the host</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask Krystal for an admin invite if you need to manage events.
        </p>
      </div>
    );
  }

  const event = events.find((e) => e.id === eventId) || null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Back office</h1>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {e.date}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={createEvent}>
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link
          to="/admin"
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs',
            pathname === '/admin' ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
          )}
        >
          Event &amp; providers
        </Link>
        <Link
          to="/admin/guests"
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs',
            pathname === '/admin/guests' ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
          )}
        >
          Guest desk
        </Link>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs',
              tab === t.key ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!event && <p className="text-sm text-muted-foreground">Create an event to get started.</p>}
      {event && tab === 'tonight' && <AdminTonightTab event={event} onChanged={loadEvents} />}
      {event && tab === 'providers' && <AdminProvidersTab event={event} />}
      {event && tab === 'guests' && <AdminGuestDesk event={event} />}
      {event && tab === 'feedback' && <AdminFeedbackTab event={event} />}
      {event && tab === 'giving' && <AdminDonationsTab event={event} />}
      {event && tab === 'event' && <AdminEventsTab event={event} onChanged={loadEvents} />}
      {tab === 'charities' && <AdminCharitiesTab />}
    </div>
  );
}