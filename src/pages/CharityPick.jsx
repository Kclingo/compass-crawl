import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import BackLink from '@/components/BackLink';
import { isCheckInClosed } from '@/lib/compass';
import { cn } from '@/lib/utils';

export default function CharityPick() {
  const navigate = useNavigate();
  const { event, loading } = useCurrentEvent();
  const { attendee, pick, loading: passLoading, reload } = useMyPass(event?.id);
  const [charities, setCharities] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Charity.filter({ active: true }, { sort: 'sort_order', limit: 20 }).then((page) =>
      setCharities(page.items)
    );
  }, []);

  if (loading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">The next Crawl is being planned.</p>;

  if (!attendee) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl">Claim your pass first</p>
        <p className="mt-1 text-sm text-muted-foreground">Your cause comes right after your pass.</p>
        <Button asChild className="mt-4">
          <Link to="/pass/new">Claim my free pass</Link>
        </Button>
      </div>
    );
  }

  const locked = isCheckInClosed(event) || attendee.status === 'waitlist';

  async function choose(charity) {
    setSaving(true);
    if (pick) {
      await base44.entities.CharityPick.update(pick.id, {
        charity_id: charity.id,
        amount: attendee.gift_status === 'paid' ? attendee.gift_amount : pick.amount || 0,
      });
    } else {
      await base44.entities.CharityPick.create({
        event_id: event.id,
        attendee_id: attendee.id,
        user_id: attendee.user_id || '',
        charity_id: charity.id,
        amount: attendee.gift_status === 'paid' ? attendee.gift_amount : 0,
      });
    }
    await reload();
    setSaving(false);
    if (!pick) navigate('/gift');
  }

  return (
    <div className="space-y-5">
      <BackLink to="/" label="Tonight" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Pick your cause</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick exactly one of this month&rsquo;s four causes.
          {locked ? ' Check-in has closed, so this is locked.' : ' You can change it until check-in closes.'}
        </p>
      </div>

      <div className="space-y-3">
        {charities.map((charity) => {
          const selected = pick?.charity_id === charity.id;
          return (
            <button
              key={charity.id}
              type="button"
              disabled={saving || locked}
              onClick={() => choose(charity)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition',
                selected ? 'border-accent ring-1 ring-accent' : 'border-border'
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg text-secondary">
                {charity.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg leading-tight">{charity.name}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{charity.description}</span>
              </span>
              {selected && <Check className="mt-1 h-5 w-5 shrink-0 text-accent-strong" />}
            </button>
          );
        })}
        {!charities.length && (
          <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            This month&rsquo;s causes are posted before the night.
          </p>
        )}
      </div>

      <Button asChild className="w-full" variant={pick ? 'default' : 'outline'}>
        <Link to={pick ? '/pass' : '/gift'}>{pick ? 'Back to my pass' : 'Skip the gift for now'}</Link>
      </Button>
    </div>
  );
}