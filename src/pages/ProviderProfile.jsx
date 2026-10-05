import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Bookmark, BookmarkCheck, Mail, Stamp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProviderAvatar from '@/components/ProviderAvatar';
import BackLink from '@/components/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyTicket from '@/hooks/useMyTicket';
import useEventProviders from '@/hooks/useEventProviders';
import { formatClock } from '@/lib/compass';

const CONNECT_FIELDS = [
  { key: 'booking_link', label: 'Book' },
  { key: 'website', label: 'Website' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
];

export default function ProviderProfile() {
  const { id } = useParams();
  const { event } = useCurrentEvent();
  const { ticket, stamps } = useMyTicket(event?.id);
  const { eventProviders } = useEventProviders(event?.id);
  const [provider, setProvider] = useState(null);
  const [savedRecord, setSavedRecord] = useState(null);
  const [pastCount, setPastCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [record, user, history] = await Promise.all([
        base44.entities.Provider.get(id),
        base44.auth.me(),
        base44.entities.EventProvider.filter({ provider_id: id, is_active: true }, { limit: 50 }),
      ]);
      if (!active) return;
      setProvider(record);
      setPastCount(history.items.length);
      const existing = await base44.entities.SavedProvider.filter(
        { user_id: user.id, provider_id: id },
        { limit: 1 }
      );
      if (active) {
        setSavedRecord(existing.items[0] || null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function toggleSave() {
    const user = await base44.auth.me();
    if (savedRecord) {
      await base44.entities.SavedProvider.delete(savedRecord.id);
      setSavedRecord(null);
    } else {
      const created = await base44.entities.SavedProvider.create({
        user_id: user.id,
        provider_id: id,
        event_id: event?.id,
      });
      setSavedRecord(created);
    }
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!provider) return <p className="text-sm text-muted-foreground">Provider not found.</p>;

  const showcase = eventProviders.find((ep) => ep.provider_id === id);
  const stamped = showcase && stamps.some((s) => s.event_provider_id === showcase.id);

  return (
    <div className="space-y-5">
      <BackLink to="/providers" label="All providers" />
      <div className="flex items-center gap-4">
        <ProviderAvatar provider={provider} className="h-20 w-20 text-2xl" />
        <div className="min-w-0">
          <h1 className="font-heading text-2xl leading-tight">{provider.name}</h1>
          <p className="text-sm text-muted-foreground">{provider.business}</p>
          {provider.category && (
            <Badge variant="outline" className="mt-2 capitalize">
              {provider.category}
            </Badge>
          )}
        </div>
      </div>

      {provider.bio && <p className="text-sm leading-relaxed text-foreground/90">{provider.bio}</p>}
      {provider.services && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Services</p>
          <p className="mt-1 text-sm">{provider.services}</p>
        </div>
      )}

      {showcase && (
        <div className="rounded-lg border border-accent/40 bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Tonight&rsquo;s showcase</p>
          <p className="mt-1 font-heading text-lg">{showcase.showcase_title}</p>
          <p className="text-sm text-muted-foreground">
            {formatClock(showcase.showcase_time)}
            {showcase.table_number ? ` · Table ${showcase.table_number}` : ''}
          </p>
          {showcase.showcase_description && (
            <p className="mt-2 text-sm text-muted-foreground">{showcase.showcase_description}</p>
          )}
          {ticket?.checked_in_at && showcase.stamp_code && (
            <Button asChild size="sm" className="mt-3" variant={stamped ? 'outline' : 'default'}>
              <Link to={`/stamp?t=${showcase.id}`}>
                <Stamp className="mr-1.5 h-4 w-4" />
                {stamped ? 'Stamp collected' : 'Get my stamp'}
              </Link>
            </Button>
          )}
        </div>
      )}

      {provider.offer && (
        <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          <span className="font-medium">For crawl guests: </span>
          {provider.offer}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(provider.booking_link || provider.website) && (
          <Button asChild className="col-span-2">
            <a href={provider.booking_link || provider.website} target="_blank" rel="noreferrer">
              Follow up <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
        {CONNECT_FIELDS.filter((f) => provider[f.key] && f.key !== 'booking_link').map((f) => (
          <Button key={f.key} asChild variant="outline">
            <a href={provider[f.key]} target="_blank" rel="noreferrer">
              {f.label}
            </a>
          </Button>
        ))}
        {provider.email && (
          <Button asChild variant="outline">
            <a href={`mailto:${provider.email}`}>
              <Mail className="mr-1.5 h-4 w-4" /> Email
            </a>
          </Button>
        )}
        <Button variant={savedRecord ? 'secondary' : 'outline'} onClick={toggleSave} className="col-span-2">
          {savedRecord ? (
            <>
              <BookmarkCheck className="mr-2 h-4 w-4" /> Saved to my providers
            </>
          ) : (
            <>
              <Bookmark className="mr-2 h-4 w-4" /> Save this provider
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Has been part of {pastCount} {pastCount === 1 ? 'crawl' : 'crawls'}.
      </p>
    </div>
  );
}