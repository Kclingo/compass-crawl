import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import useEventProviders from '@/hooks/useEventProviders';
import { buildRunOfShow, combineDateTime, formatClock } from '@/lib/compass';
import { cn } from '@/lib/utils';

export default function Schedule() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { attendee, loading: passLoading, reload } = useMyPass(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [reminders, setReminders] = useState([]);

  const loadReminders = useCallback(async () => {
    if (!attendee) {
      setReminders([]);
      return;
    }
    const page = await base44.entities.Reminder.filter(
      { attendee_id: attendee.id, status: 'pending' },
      { limit: 50 }
    );
    setReminders(page.items);
  }, [attendee]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  if (eventLoading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">The next Crawl is being planned.</p>;

  const rows = buildRunOfShow(event, eventProviders, providersById);
  const savedIds = new Set(reminders.map((r) => r.event_provider_id));
  const nextRow = rows.find((r) => {
    const at = combineDateTime(event.date, r.time);
    return at && at.getTime() > Date.now();
  });

  async function toggleRemind(row) {
    if (!attendee) return;
    const existing = reminders.find((r) => r.event_provider_id === row.ep.id);
    if (existing) {
      await base44.entities.Reminder.delete(existing.id);
    } else {
      const start = combineDateTime(event.date, row.ep.showcase_time);
      await base44.entities.Reminder.create({
        event_id: event.id,
        attendee_id: attendee.id,
        user_id: attendee.user_id || '',
        event_provider_id: row.ep.id,
        remind_at: start ? new Date(start.getTime() - 5 * 60000).toISOString() : '',
        channel: attendee.text_opt_in ? 'sms' : 'in_app',
        status: 'pending',
      });
    }
    loadReminders();
  }

  async function toggleAll(next) {
    await base44.entities.Attendee.update(attendee.id, { remind_all: next });
    reload();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No set route. Pick the showcases you want and we&rsquo;ll remind you 5 minutes before each one.
        </p>
      </div>

      {attendee?.checked_in_at && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium">Remind me about every showcase</p>
            <p className="text-xs text-muted-foreground">One alert before each one, no tapping required.</p>
          </div>
          <Switch checked={Boolean(attendee.remind_all)} onCheckedChange={toggleAll} />
        </div>
      )}

      {!attendee && (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Claim your free pass first, then you can save showcases and set reminders.
        </p>
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
                <span className="w-16 shrink-0 font-heading text-lg text-accent-strong">{formatClock(row.time)}</span>
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
                      {attendee?.checked_in_at && !attendee.remind_all && (
                        <Button
                          variant={saved ? 'default' : 'outline'}
                          size="sm"
                          className="mt-3"
                          onClick={() => toggleRemind(row)}
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
            <Clock className="mr-2 inline h-4 w-4" /> The run of show is posted before the night.
          </li>
        )}
      </ol>
    </div>
  );
}