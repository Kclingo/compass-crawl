import React from 'react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/lib/compass';

export default function ProviderAvatar({ provider, className = 'h-12 w-12 text-base' }) {
  if (provider?.photo) {
    return (
      <Image
        src={provider.photo}
        alt={provider.name}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-heading tracking-widest text-secondary',
        className
      )}
    >
      {initialsOf(provider?.name)}
    </span>
  );
}