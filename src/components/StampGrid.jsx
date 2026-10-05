import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Stamp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/lib/compass';

export default function StampGrid({ slots, stampedIds }) {
  if (!slots.length) return null;
  return (
    <div className="grid grid-cols-4 gap-3">
      {slots.map((slot) => {
        const filled = stampedIds.has(slot.id);
        return (
          <Link key={slot.id} to={`/providers/${slot.providerId}`} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full border-2 font-heading text-lg transition',
                filled
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-dashed border-border bg-card text-muted-foreground'
              )}
            >
              {filled ? <Stamp className="h-5 w-5" /> : initialsOf(slot.name)}
            </span>
            <span className="line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground">
              {slot.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function RaffleBadge({ entered }) {
  if (!entered) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
      <Check className="h-3.5 w-3.5" /> You&rsquo;re in the raffle
    </span>
  );
}