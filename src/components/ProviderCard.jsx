import React from 'react';
import { Link } from 'react-router-dom';
import ProviderAvatar from '@/components/ProviderAvatar';
import { cn } from '@/lib/utils';

const STAGGER = [
  '[animation-delay:150ms]',
  '[animation-delay:250ms]',
  '[animation-delay:350ms]',
  '[animation-delay:450ms]',
  '[animation-delay:550ms]',
];

export default function ProviderCard({ provider, showcase, index = 0 }) {
  return (
    <Link
      to={`/providers/${provider.id}`}
      className={cn(
        "grid animate-rise grid-cols-[76px_1fr_auto] items-center gap-7 border-b border-border px-1 pt-[31px] pb-8 text-foreground transition-colors duration-200 hover:bg-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent active:bg-secondary",
        STAGGER[Math.min(index, STAGGER.length - 1)]
      )}
    >
      <ProviderAvatar provider={provider} className="h-[68px] w-[68px] text-lg tracking-[0.08em]" />

      <div className="min-w-0">
        {provider.category && (
          <div className="mb-[9px] text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {provider.category}
          </div>
        )}
        <h2 className="mb-[5px] font-heading text-[28px] font-normal leading-[1.2]">{provider.name}</h2>
        {(provider.business || provider.category) && (
          <p className="text-sm leading-[1.55] text-muted-foreground">{provider.business || provider.category}</p>
        )}
        {showcase?.showcase_time && (
          <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
            Table {showcase.table_number} · {showcase.showcase_title}
          </p>
        )}
        {provider.offer && (
          <span className="mt-3 inline-block rounded-full border border-accent bg-secondary px-3 py-[7px] text-[11px] leading-[1.3] text-secondary-foreground">
            {provider.offer}
          </span>
        )}
      </div>

      {provider.category && (
        <span className="mt-1.5 self-start whitespace-nowrap rounded-full border border-border px-[11px] py-[7px] text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          {provider.category}
        </span>
      )}
    </Link>
  );
}