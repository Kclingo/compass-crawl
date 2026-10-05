import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyTicket from '@/hooks/useMyTicket';
import useEventProviders from '@/hooks/useEventProviders';
import { combineDateTime, formatClock } from '@/lib/compass';
import { cn } from '@/lib/utils';

export default function Schedule() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { ticket, loading: ticketLoading, reload } = useMyTicket(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [reminders, setReminders] = useState([]);

  const loadReminders = useCallback(async () => {
    if (!ticket) {
      setReminders([]);
      return;
    }
    const page = await base44.entities.Reminder.filter({ ticket_id: ticket.id, status: 'pending' }, { limit: 50 });
    setReminders(page.items);
  }, [ticket]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  if (eventLoading || ticketLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">No crawl scheduled yet.</p>;

  const rows = [
    { key: 'checkin', time: event.start_time, label: 'Check in, grab food, browse providers', kind: 'note' },
    { key: 'welcome', time: event.welcome_time, label: 'Welcome', kind: 'note' },
    ...eventProviders.map((ep) => ({
      key: ep.id,
      time: ep.showcase_time,
      label: ep.showcase_title || `${providersById[ep.provider_id]?.name || 'Provider'} showcase`,
      kind: 'showcase',
      ep,
    })),
    { key: 'lastcall', time: event.last_call_time, label: 'Last call for stamps, donation total, raffle', kind: 'note' },
  ]
    .filter((r) => r.time)
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  const savedIds = new Set(reminders.map((r) => r.event_provider_id));
  const nextRow = rows.find((r) => {
    const at = combineDateTime(event.date, r.time);
    return at && at.getTime() > Date.now();
  });

  async function toggleRemind(ep) {
    if (!ticket) return;
    const existing = reminders.find((r) => r.event_provider_id === ep.id);
    if (existing) {
      await base44.entities.Reminder.delete(existing.id);
    } else {
      const start = combineDateTime(event.date, ep.showcase_time);
      await base44.entities.Reminder.create({
        event_id: event.id,
        ticket_id: ticket.id,
        event_provider_id: ep.id,
        remind_at: start ? new Date(start.getTime() - 5 * 60000).toISOString() : '',
        channel: ticket.text_opt_in ? 'sms' : 'in_app',
        status: 'pending',
      });
    }
    loadReminders();
  }

  async function toggleAll(next) {
    await base44.entities.Ticket.update(ticket.id, { remind_all: next });
    reload();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Tonight</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No set route. Pick the showcases you want and we&rsquo;ll remind you 5 minutes before.
        </p>
      </div>

      {!ticket && (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Get a ticket first, then you can save showcases and set reminders.
        </p>
      )}

      {ticket && ticket.checked_in_at && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium">Remind me about every showcase</p>
            <p className="text-xs text-muted-foreground">One alert before each one, no tapping required.</p>
          </div>
          <Switch checked={Boolean(ticket.remind_all)} onCheckedChange={toggleAll} />
        </div>
      )}

      <ol className="space-y-2">
        {rows.map((row) => {
          const isNext = nextRow?.key === row.key;
          const at = combineDateTime(event.date, row.time);
          const past = at ? at.getTime() < Date.now() - 10 * 60000 : false;
          const saved = row.kind === 'showcase' && savedIds.has(row.ep.id);

          return (
            <li
              key={row.key}
              className={cn(
                'rounded-lg border bg-card p-4',
                isNext ? 'border-accent' : 'border-border',
                past && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                <span className="w-16 shrink-0 font-heading text-lg text-accent">{formatClock(row.time)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{row.label}</p>
                    {isNext && <Badge className="bg-accent text-accent-foreground">Next</Badge>}
                  </div>
                  {row.kind === 'showcase' && (
                    <>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {providersById[row.ep.provider_id]?.name}
                        {row.ep.table_number ? ` · Table ${row.ep.table_number}` : ''}
                      </p>
                      {row.ep.showcase_description && (
                        <p className="mt-1 text-xs text-muted-foreground">{row.ep.showcase_description}</p>
                      )}
                      {ticket?.checked_in_at && !ticket.remind_all && (
                        <Button
                          variant={saved ? 'default' : 'outline'}
                          size="sm"
                          className="mt-3"
                          onClick={() => toggleRemind(row.ep)}
                        >
                          {saved ? (
                            <>
                              <BellOff className="mr-1.5 h-3.5 w-3.5" /> Reminder set
                            </>
                          ) : (
                            <>
                              <Bell className="mr-1.5 h-3.5 w-3.5" /> Remind me
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {!rows.length && (
          <li className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            <Clock className="mr-2 inline h-4 w-4" /> The run of show gets built from the provider list.
          </li>
        )}
      </ol>
    </div>
  );
}