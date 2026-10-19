import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MyProvidersCard() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await base44.auth.me();
      const saved = await base44.entities.SavedProvider.filter({ user_id: user.id }, { limit: 100 });
      const ids = saved.items.map((s) => s.provider_id);
      if (!ids.length) {
        if (active) {
          setProviders([]);
          setLoading(false);
        }
        return;
      }
      const page = await base44.entities.Provider.filter({ id: { $in: ids } }, { sort: 'name', limit: 100 });
      if (active) {
        setProviders(page.items);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-heading text-xl">
        <Star className="h-5 w-5 text-accent-strong" /> My providers
      </p>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      ) : providers.length ? (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {providers.map((provider) => (
            <li key={provider.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/providers/${provider.id}`} className="block truncate text-sm font-medium">
                  {provider.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {[provider.business, provider.category].filter(Boolean).join(' · ')}
                </p>
              </div>
              {provider.booking_link && (
                <a
                  href={provider.booking_link}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs uppercase tracking-[0.15em] text-accent-strong"
                >
                  Follow up
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing saved yet. Open a provider and tap Save to keep them here.
        </p>
      )}
    </section>
  );
}