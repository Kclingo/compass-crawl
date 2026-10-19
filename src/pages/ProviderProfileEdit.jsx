import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BackLink from '@/components/BackLink';
import ProviderProfileForm from '@/components/provider/ProviderProfileForm';

export default function ProviderProfileEdit() {
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const me = await base44.auth.me();
      const page = await base44.entities.Provider.filter(
        { $or: [{ user_id: me.id }, { email: me.email }] },
        { limit: 1 }
      );
      if (!active) return;
      setUser(me);
      setProvider(page.items[0] || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  return (
    <div className="space-y-6">
      <BackLink to="/" label="Passport" />

      <header>
        <h1 className="font-heading text-[28px] uppercase tracking-[0.14em] sm:text-[36px]">
          My provider profile
        </h1>
        <p className="mt-2 text-sm leading-[1.8] text-muted-foreground">
          This is what crawl guests see when they open your page. Showcase times and table numbers are set by
          the Compass Crawl team.
        </p>
      </header>

      <ProviderProfileForm provider={provider} user={user} onSaved={setProvider} />

      {provider?.id && (
        <Link
          to={`/providers/${provider.id}`}
          className="inline-block text-xs uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View my public profile
        </Link>
      )}
    </div>
  );
}