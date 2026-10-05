import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stamp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useMyTicket from '@/hooks/useMyTicket';
import { formatClock } from '@/lib/compass';

export default function StampPage() {
  const epId = new URLSearchParams(window.location.search).get('t');
  const [slot, setSlot] = useState(null);
  const [provider, setProvider] = useState(null);
  const { ticket, stamps, loading, reload } = useMyTicket(slot?.event_id);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!epId) return;
    base44.entities.EventProvider.get(epId).then(async (record) => {
      setSlot(record);
      const p = await base44.entities.Provider.get(record.provider_id);
      setProvider(p);
    });
  }, [epId]);

  if (!epId) return <p className="text-sm text-muted-foreground">Scan the QR code on the provider&rsquo;s table card.</p>;
  if (!slot || loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  const existing = stamps.find((s) => s.event_provider_id === slot.id);

  async function submit() {
    setMessage('');
    if (code.trim().length !== 4) {
      setMessage('Ask the provider for their 4-digit code.');
      return;
    }
    if (code.trim() !== (slot.stamp_code || '').trim()) {
      setMessage('That code isn\u2019t right. Ask the provider to double-check.');
      return;
    }
    setBusy(true);
    await base44.entities.Stamp.create({
      event_id: slot.event_id,
      ticket_id: ticket.id,
      event_provider_id: slot.id,
      provider_id: slot.provider_id,
      stamped_at: new Date().toISOString(),
    });
    await reload();
    setBusy(false);
  }

  function body() {
    if (!ticket) {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Stamps are tied to your passport. Get a ticket with this account and you&rsquo;re set.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/tickets/new">Get your ticket</Link>
          </Button>
        </>
      );
    }
    if (!ticket.checked_in_at) {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Check in at the entrance first, then come back and collect stamps.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to={`/check-in?event=${slot.event_id}`}>Check in</Link>
          </Button>
        </>
      );
    }
    if (existing) {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            Stamped at {new Date(existing.stamped_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
            One stamp per provider.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/">Back to my passport</Link>
          </Button>
        </>
      );
    }
    return (
      <>
        <p className="text-sm text-muted-foreground">
          Ask {provider?.name || 'the provider'} for tonight&rsquo;s 4-digit code, or hand them your phone.
        </p>
        <Input
          className="mt-4 text-center font-heading text-2xl tracking-[0.5em]"
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="0000"
        />
        {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
        <Button className="mt-4 w-full" onClick={submit} disabled={busy}>
          <Stamp className="mr-2 h-4 w-4" />
          {busy ? 'Stamping…' : 'Fill in my stamp'}
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary p-5 text-center text-primary-foreground">
        <p className="text-[11px] uppercase tracking-[0.25em] text-secondary">
          Table {slot.table_number || '—'} · {formatClock(slot.showcase_time)}
        </p>
        <h1 className="mt-2 font-heading text-3xl">{provider?.name}</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">
          {slot.showcase_title || provider?.business}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">{body()}</div>
    </div>
  );
}