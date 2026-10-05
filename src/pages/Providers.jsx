import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProviderCard from '@/components/ProviderCard';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useEventProviders from '@/hooks/useEventProviders';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Providers() {
  const { event } = useCurrentEvent();
  const { eventProviders } = useEventProviders(event?.id);
  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [user, distinct] = await Promise.all([
        base44.auth.me(),
        base44.entities.Provider.list({ distinct: 'category' }),
      ]);
      if (!active) return;
      setCategories((distinct.items || []).filter(Boolean));
      const saved = await base44.entities.SavedProvider.filter({ user_id: user.id }, { limit: 100 });
      if (active) setSavedIds(saved.items.map((s) => s.provider_id));
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const query = { active: true };
      if (category !== 'all') query.category = category;
      if (tab === 'saved') {
        if (!savedIds.length) {
          setProviders([]);
          setLoading(false);
          return;
        }
        query.id = { $in: savedIds };
      }
      const page = await base44.entities.Provider.filter(query, { sort: 'name', limit: 100 });
      if (!active) return;
      setProviders(page.items);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [tab, category, savedIds]);

  const showcaseFor = (providerId) => eventProviders.find((ep) => ep.provider_id === providerId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Say hi at the table to collect their stamp. Profiles stay here after tonight, so you can follow up later.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Everyone' },
          { key: 'saved', label: `My providers${savedIds.length ? ` (${savedIds.length})` : ''}` },
        ].map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? 'default' : 'outline'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs capitalize',
                category === c ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
              )}
            >
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} showcase={showcaseFor(p.id)} />
          ))}
          {!providers.length && (
            <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
              {tab === 'saved' ? (
                <>
                  <Star className="mr-2 inline h-4 w-4" /> Nothing saved yet. Open a provider and tap Save.
                </>
              ) : (
                'No providers in this category yet.'
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}