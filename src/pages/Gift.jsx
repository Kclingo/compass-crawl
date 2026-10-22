import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import BackLink from '@/components/BackLink';
import { money } from '@/lib/compass';

export default function Gift() {
  const navigate = useNavigate();
  const { event, loading } = useCurrentEvent();
  const { attendee, pick, loading: passLoading, reload } = useMyPass(event?.id);
  const [charity, setCharity] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pick?.charity_id) {
      setCharity(null);
      return;
    }
    base44.entities.Charity.get(pick.charity_id).then(setCharity);
  }, [pick?.charity_id]);

  if (loading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">The next Crawl is being planned.</p>;

  if (!attendee) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl">Claim your pass first</p>
        <Button asChild className="mt-4">
          <Link to="/pass/new">Claim my free pass</Link>
        </Button>
      </div>
    );
  }

  const amount = Number(event.gift_suggested_amount || 5);

  async function give() {
    setError('');
    setBusy(true);

    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setBusy(false);
      setError('Allow popups in your browser to continue to checkout.');
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    try {
      const response = await base44.functions.invoke('createGiftCheckout', {
        attendee_id: attendee.id,
        amount,
      });
      const url = response.data?.url;
      if (!url) throw new Error(response.data?.error || 'Checkout could not be created.');
      if (checkoutTab) checkoutTab.location.replace(url);
      else window.location.assign(url);
    } catch (err) {
      checkoutTab?.close();
      setError(err.message || 'Checkout could not be started.');
      setBusy(false);
    }
  }

  if (attendee.gift_status === 'paid') {
    return (
      <div className="space-y-5">
        <BackLink to="/me" label="Me" />
        <div className="rounded-lg border border-accent bg-card p-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-accent-strong" />
          <p className="mt-3 font-heading text-xl">Your gift is in</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {money(attendee.gift_amount)} went to {charity ? charity.name : 'the cause you picked'} through Therapy
            Hour &amp; Co. Stripe emails the receipt.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/me">Back to Me</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink to={pick ? '/cause' : '/'} label={pick ? 'Cause' : 'Tonight'} />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Give {money(amount)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entirely optional. It goes through Therapy Hour &amp; Co. to {charity ? charity.name : 'the cause you pick'},
          and Stripe emails your receipt.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="flex items-center justify-between text-sm">
          <span>Gift to {charity ? charity.name : 'my cause'}</span>
          <span className="font-heading text-lg">{money(amount)}</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Card, Apple Pay or Google Pay at checkout. This is a gift, not a ticket or care service.
        </p>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="w-full" onClick={give} disabled={busy}>
        <Heart className="mr-2 h-4 w-4" /> {busy ? 'Opening checkout…' : `Give ${money(amount)}`}
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => navigate('/pass')}>
        Skip for now
      </Button>
    </div>
  );
}