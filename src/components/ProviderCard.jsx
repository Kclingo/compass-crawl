import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import ProviderAvatar from '@/components/ProviderAvatar';
import { Badge } from '@/components/ui/badge';

export default function ProviderCard({ provider, showcase }) {
  return (
    <Link
      to={`/providers/${provider.id}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-accent"
    >
      <ProviderAvatar provider={provider} />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-base leading-tight text-foreground">{provider.name}</p>
        <p className="truncate text-xs text-muted-foreground">{provider.business || provider.category}</p>
        {showcase?.showcase_time && (
          <p className="mt-1 text-xs text-muted-foreground">
            Table {showcase.table_number} · {showcase.showcase_title}
          </p>
        )}
        {provider.offer && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
            <Gift className="h-3 w-3" /> {provider.offer}
          </span>
        )}
      </div>
      {provider.category && <Badge variant="outline" className="shrink-0">{provider.category}</Badge>}
    </Link>
  );
}