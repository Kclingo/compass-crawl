import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProviderCard from '@/components/ProviderCard';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useEventProviders from '@/hooks/useEventProviders';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'Everyone' },
  { key: 'saved', label: 'My providers' },
];

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
    <div>
      <section className="mb-[42px]">
        <h1 className="relative mb-[19px] pb-6 font-heading text-[34px] font-normal uppercase leading-[1.05] tracking-[0.14em] sm:text-[46px] lg:text-[58px]">
          Providers
          <span aria-hidden="true" className="absolute bottom-0 left-0 h-px w-full origin-left animate-draw bg-foreground" />
        </h1>
        <p className="max-w-[760px] text-base leading-[1.8] text-muted-foreground">
          Say hi at the table to collect their stamp. Profiles stay here after tonight, so you can follow up later.
        </p>
      </section>

      <div className="mb-[30px] flex gap-[34px] border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "relative pb-[17px] text-sm transition-colors duration-200 after:absolute after:-bottom-px after:inset-x-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:content-[''] after:transition-transform after:[transition-duration:220ms] focus-visible:text-foreground focus-visible:after:scale-x-100 active:text-accent-strong",
              tab === t.key
                ? 'text-foreground after:scale-x-100'
                : 'text-muted-foreground hover:text-foreground hover:after:scale-x-100'
            )}
          >
            {t.key === 'saved' && savedIds.length ? `${t.label} (${savedIds.length})` : t.label}
          </button>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-[11px]">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "relative rounded-full border px-[17px] py-[10px] text-xs tracking-[0.02em] transition-colors duration-200 after:absolute after:bottom-[3px] after:left-[15px] after:right-[15px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:content-[''] after:transition-transform after:[transition-duration:220ms] focus-visible:text-foreground focus-visible:after:scale-x-100 active:text-accent-strong",
                category === c
                  ? 'border-accent bg-secondary text-foreground after:scale-x-100'
                  : 'border-border bg-background text-muted-foreground hover:border-accent hover:text-foreground hover:after:scale-x-100'
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
        <div className="border-t border-border">
          {providers.map((p, i) => (
            <ProviderCard key={p.id} provider={p} showcase={showcaseFor(p.id)} index={i} />
          ))}
          {!providers.length && (
            <p className="border-b border-border py-8 text-sm leading-[1.8] text-muted-foreground">
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