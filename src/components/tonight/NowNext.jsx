import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatClock, minutesUntil, nowAndNext } from '@/lib/compass';

export default function NowNext({ event, rows, providersById }) {
  const { now, next, nextAt } = nowAndNext(event, rows);
  if (!now && !next) return null;

  const label = (row) => (row.kind === 'showcase' ? row.label : row.label);
  const where = (row) =>
    row.kind === 'showcase'
      ? [providersById[row.ep.provider_id]?.name, row.ep.table_number ? `Table ${row.ep.table_number}` : '']
          .filter(Boolean)
          .join(' · ')
      : '';
  const minutes = nextAt ? minutesUntil(nextAt) : null;

  return (
    <section className="rounded-lg border border-accent bg-card p-5">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Happening now
      </p>
      {now ? (
        <div className="mt-3">
          <p className="font-heading text-xl leading-tight">{label(now)}</p>
          {where(now) && <p className="mt-1 text-sm text-muted-foreground">{where(now)}</p>}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">The doors are open. Take your time.</p>
      )}

      {next && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="flex items-center gap-2 text-sm">
            <Badge className="bg-accent text-accent-foreground">Next</Badge>
            <span className="font-medium">{label(next)}</span>
            <span className="text-muted-foreground">
              {formatClock(next.time)}
              {minutes !== null && minutes >= 0 && minutes <= 60 ? ` · in ${minutes} min` : ''}
            </span>
          </p>
          {where(next) && <p className="mt-1 text-xs text-muted-foreground">{where(next)}</p>}
        </div>
      )}
    </section>
  );
}