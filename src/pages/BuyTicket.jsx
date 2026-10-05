import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Ticket as TicketIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectField, TextField } from '@/components/admin/fields';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import BackLink from '@/components/BackLink';
import useMyTicket from '@/hooks/useMyTicket';
import { formatEventDate, money, resolveTicketTier } from '@/lib/compass';

const AGE_RANGES = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+', 'Prefer not to say'];
const SOURCES = ['Instagram', 'Friend or word of mouth', 'A provider', 'The venue', 'Other', 'Prefer not to say'];
const FIRST_CRAWL = ['Yes, my first', "No, I've been before", 'Prefer not to say'];

export default function BuyTicket() {
  const navigate = useNavigate();
  const { event, loading: eventLoading } = useCurrentEvent();
  const { ticket, loading: ticketLoading } = useMyTicket(event?.id);
  const [sold, setSold] = useState(null);
  const [earlyBirdSold, setEarlyBirdSold] = useState(0);
  const [form, setForm] = useState({
    attendee_name: '',
    email: '',
    phone: '',
    age_range: 'Prefer not to say',
    zip_code: '',
    referral_source: 'Prefer not to say',
    first_crawl: 'Prefer not to say',
    text_opt_in: false,
    eighteen_confirmed: false,
  });
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.auth.me().then((user) =>
      setForm((f) => ({ ...f, attendee_name: f.attendee_name || user?.full_name || '', email: f.email || user?.email || '' }))
    );
  }, []);

  useEffect(() => {
    if (!event) return;
    Promise.all([
      base44.entities.Ticket.count({ event_id: event.id, status: 'active' }),
      base44.entities.Ticket.count({ event_id: event.id, status: 'active', price_tier: 'early_bird' }),
    ]).then(([total, early]) => {
      setSold(total);
      setEarlyBirdSold(early);
    });
  }, [event]);

  if (eventLoading || ticketLoading || sold === null) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">No crawl on sale right now.</p>;

  const isSoldOut = sold >= (event.ticket_cap || 0);
  const tier = resolveTicketTier(event, earlyBirdSold);
  const discount = promo ? Math.round((tier.price * promo.percent_off) / 100) : 0;
  const netPrice = Math.max(tier.price - discount, 0);
  const fee = netPrice > 0 && event.pass_fees_to_buyer ? Number(event.fee_amount || 0) : 0;
  const total = netPrice + fee;

  function applyPromo() {
    const match = (event.promo_codes || []).find(
      (p) => p.code && p.code.toLowerCase() === promoInput.trim().toLowerCase()
    );
    setPromo(match || null);
    setError(match ? '' : 'That code is not valid for this event.');
  }

  async function startCheckout() {
    if (!form.attendee_name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (!form.eighteen_confirmed) {
      setError('Please confirm you are 18 or older.');
      return;
    }
    setError('');

    // Open the checkout tab in the same click, before awaiting, so popup blockers allow it.
    const isFree = total <= 0;
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed && !isFree ? window.open('', '_blank') : null;
    if (isFramed && !isFree && !checkoutTab) {
      setError('Allow popups to continue to checkout.');
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setSubmitting(true);
    try {
      let ticketId = ticket?.id;
      if (!ticketId) {
        const created = await base44.entities.Ticket.create({
          event_id: event.id,
          ...form,
          price_tier: tier.tier,
          amount_paid: total,
          promo_code: promo?.code || '',
          payment_status: 'pending',
          status: 'active',
        });
        ticketId = created.id;
      }
      const response = await base44.functions.invoke('createTicketCheckout', { ticket_id: ticketId });
      if (response.data?.free) {
        navigate('/charity');
        return;
      }
      const url = response.data?.url;
      if (!url) throw new Error(response.data?.error || 'Checkout could not be started.');
      if (checkoutTab) {
        checkoutTab.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (e) {
      checkoutTab?.close();
      setError(e?.response?.data?.error || e?.message || 'Checkout could not be started.');
      setSubmitting(false);
    }
  }

  if (ticket && ticket.payment_status === 'paid') {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-2 font-heading text-xl">You&rsquo;re already on the list</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One passport per guest. Head to your passport to check in.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Go to my passport</Link>
        </Button>
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-center">
        <p className="font-heading text-xl">Tonight is full</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All {event.ticket_cap} tickets are gone. Come say hi at the next crawl.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink to="/" label="My passport" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">Your ticket</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEventDate(event.date)} · {event.venue}
        </p>
      </div>

      <div className="rounded-lg border border-accent/40 bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-medium">{tier.label}</p>
          <p className="font-heading text-2xl text-accent">{money(tier.price)}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {money(event.donation_amount)} of every ticket goes to the nonprofit you pick. {sold} of{' '}
          {event.ticket_cap} taken
          {tier.tier === 'early_bird' ? ` · early bird for the first ${event.early_bird_limit}` : ''}.
        </p>
      </div>

      <div className="space-y-3">
        <TextField label="Full name" value={form.attendee_name} onChange={(v) => setForm({ ...form, attendee_name: v })} />
        <TextField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <TextField
          label="Mobile (for text reminders)"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="(727) 555-0100"
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Optional — helps Krystal plan</p>
        <SelectField
          label="Age range"
          value={form.age_range}
          onChange={(v) => setForm({ ...form, age_range: v })}
          options={AGE_RANGES.map((a) => ({ value: a, label: a }))}
        />
        <TextField label="ZIP code" value={form.zip_code} onChange={(v) => setForm({ ...form, zip_code: v })} />
        <SelectField
          label="How did you hear about us?"
          value={form.referral_source}
          onChange={(v) => setForm({ ...form, referral_source: v })}
          options={SOURCES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="First Compass Crawl?"
          value={form.first_crawl}
          onChange={(v) => setForm({ ...form, first_crawl: v })}
          options={FIRST_CRAWL.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Promo code</Label>
        <div className="flex gap-2">
          <Input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Enter a code" />
          <Button type="button" variant="outline" onClick={applyPromo}>
            Apply
          </Button>
        </div>
        {promo && (
          <p className="text-xs text-accent">
            {promo.label || promo.code} applied · {promo.percent_off}% off
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="adult"
            checked={form.eighteen_confirmed}
            onCheckedChange={(v) => setForm({ ...form, eighteen_confirmed: Boolean(v) })}
          />
          <Label htmlFor="adult" className="text-sm font-normal">
            I confirm I am 18 or older.
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="texts"
            checked={form.text_opt_in}
            onCheckedChange={(v) => setForm({ ...form, text_opt_in: Boolean(v) })}
          />
          <Label htmlFor="texts" className="text-sm font-normal">
            Text me showcase reminders tonight.
          </Label>
        </div>
      </div>

      <div className="rounded-lg bg-primary p-4 text-primary-foreground">
        <div className="flex items-center justify-between text-sm">
          <span>{tier.label}</span>
          <span>{money(tier.price)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-secondary">
            <span>Promo discount</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        {fee > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-primary-foreground/80">
            <span>Card processing (passed on, keeps the donation whole)</span>
            <span>{money(fee)}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-primary-foreground/20 pt-3">
          <span className="text-sm">Total</span>
          <span className="font-heading text-2xl text-secondary">{money(total)}</span>
        </div>
      </div>

      {ticket && ticket.payment_status !== 'paid' && (
        <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
          Your spot is held. Finish payment to lock it in.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={startCheckout} disabled={submitting}>
        <TicketIcon className="mr-2 h-4 w-4" />
        {total > 0 ? (submitting ? 'Opening checkout…' : `Pay ${money(total)}`) : 'Claim my free ticket'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Card, Apple Pay, and Google Pay. The app never handles your card details, and your donation stays whole.
      </p>
    </div>
  );
}