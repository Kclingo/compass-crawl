import React from 'react';
import { cn } from '@/lib/utils';

const STEPS = ['Your details', 'Your cause', 'Your pass'];

// Shows guests where they are in the three-step pass flow.
export default function StepHint({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border text-[11px]',
                active && 'border-accent bg-accent text-accent-foreground',
                done && 'border-accent-strong text-accent-strong',
                !active && !done && 'border-border text-muted-foreground'
              )}
            >
              {number}
            </span>
            <span
              className={cn(
                'text-[11px] uppercase tracking-[0.18em]',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
            {number < STEPS.length && <span className="text-muted-foreground">·</span>}
          </li>
        );
      })}
    </ol>
  );
}