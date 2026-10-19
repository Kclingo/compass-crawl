import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatClock } from '@/lib/compass';
import { cn } from '@/lib/utils';

function tagsFor(provider) {
  if (!provider) return [{ label: 'EMPTY', tone: 'warn' }];
  const tags = [];
  if (!provider.photo) tags.push({ label: 'NEEDS PHOTO', tone: 'warn' });
  if (!provider.bio) tags.push({ label: 'NEEDS BIO', tone: 'warn' });
  if (!provider.name || (!provider.business && !provider.category)) tags.push({ label: 'EMPTY', tone: 'warn' });
  return tags;
}

export default function ProviderAuditTable({ event }) {
  const [rows, setRows] = useState([]);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.EventProvider.filter({ event_id: event.id }, { sort: 'showcase_order', limit: 50 }),
      base44.entities.Provider.list({ sort: 'name', limit: 200 }),
    ]).then(([epPage, providerPage]) => {
      setRows(epPage.items);
      setProviders(providerPage.items);
    });
  }, [event.id]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Tonight&rsquo;s provider audit</p>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => {
          const provider = providers.find((p) => p.id === row.provider_id);
          const tags = tagsFor(provider);
          return (
            <li key={row.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {provider?.name || 'Unlinked provider'}
                    {provider?.credentials ? `, ${provider.credentials}` : ''}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[provider?.business, provider?.category].filter(Boolean).join(' · ') || 'No business or category'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.showcase_title || 'No showcase title'} ·{' '}
                    {row.showcase_time ? formatClock(row.showcase_time) : 'No time'}
                    {row.table_number ? ` · Table ${row.table_number}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {tags.length ? (
                    tags.map((tag) => (
                      <span
                        key={tag.label}
                        className="rounded-full border border-destructive px-2 py-0.5 text-[10px] tracking-wider text-destructive"
                      >
                        {tag.label}
                      </span>
                    ))
                  ) : (
                    <span className={cn('text-[10px] uppercase tracking-wider text-muted-foreground')}>Complete</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {!rows.length && (
          <li className="text-sm text-muted-foreground">
            No providers on tonight&rsquo;s roster yet. Add them on the Tonight tab.
          </li>
        )}
      </ul>
    </div>
  );
}