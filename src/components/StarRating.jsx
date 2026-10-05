import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ value = 0, onChange, size = 'h-6 w-6' }) {
  const interactive = Boolean(onChange);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange && onChange(n)}
          className={cn('transition', interactive && 'hover:scale-110')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(size, n <= value ? 'fill-accent text-accent' : 'text-muted-foreground')}
          />
        </button>
      ))}
    </div>
  );
}