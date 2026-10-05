import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StarRating from '@/components/StarRating';
import { SelectField } from '@/components/admin/fields';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyTicket from '@/hooks/useMyTicket';
import useEventProviders from '@/hooks/useEventProviders';

const RETURN_OPTIONS = ['Definitely', 'Probably', 'Not sure', 'Probably not'];

export default function Feedback() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { ticket, loading: ticketLoading } = useMyTicket(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [receipt, setReceipt] = useState(null);
  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState({});
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldReturn, setWouldReturn] = useState(RETURN_OPTIONS[0]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    base44.entities.FeedbackReceipt.filter({ ticket_id: ticket.id }, { limit: 1 }).then((page) =>
      setReceipt(page.items[0] || null)
    );
  }, [ticket]);

  if (eventLoading || ticketLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">No crawl to review.</p>;

  const open = event.feedback_open || event.status === 'closed';

  if (!open) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">Feedback opens at the close</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Come back after the raffle and tell us how the night went. Everything you write is anonymous.
        </p>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/">Back to my passport</Link>
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">Feedback is for tonight&rsquo;s guests</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers are stored against the event only, never against your name.
        </p>
      </div>
    );
  }

  async function send() {
    setBusy(true);
    await base44.entities.Feedback.create({
      event_id: event.id,
      overall_rating: overall,
      provider_ratings: eventProviders.map((ep) => ({
        provider_id: ep.provider_id,
        provider_name: providersById[ep.provider_id]?.name || '',
        rating: ratings[ep.provider_id] || 0,
      })),
      highlights,
      improvements,
      would_return: wouldReturn,
    });
    await base44.entities.FeedbackReceipt.create({
      event_id: event.id,
      ticket_id: ticket.id,
      submitted: true,
      submitted_at: new Date().toISOString(),
    });
    setSent(true);
    setBusy(false);
  }

  if (sent || receipt?.submitted) {
    return (
      <div className="rounded-lg border border-accent/40 bg-card p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-2 font-heading text-xl">Thank you</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers went in anonymously. Krystal reads every one of them.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link to="/">Back to my passport</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.15em]">How was tonight?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anonymous. Ratings, a couple of lines, or both. It takes about a minute.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">The night overall</Label>
        <div className="mt-2">
          <StarRating value={overall} onChange={setOverall} />
        </div>
      </div>

      {eventProviders.map((ep) => {
        const provider = providersById[ep.provider_id];
        return (
          <div key={ep.id} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">{provider?.name}</p>
            <p className="text-xs text-muted-foreground">{ep.showcase_title}</p>
            <div className="mt-2">
              <StarRating
                size="h-5 w-5"
                value={ratings[ep.provider_id] || 0}
                onChange={(n) => setRatings((r) => ({ ...r, [ep.provider_id]: n }))}
              />
            </div>
          </div>
        );
      })}

      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">What stood out?</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="A provider, a conversation, something you didn't expect."
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            What should we do differently?
          </Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="Timing, layout, anything at all."
          />
        </div>
        <SelectField
          label="Would you come to another crawl?"
          value={wouldReturn}
          onChange={setWouldReturn}
          options={RETURN_OPTIONS.map((o) => ({ value: o, label: o }))}
        />
      </div>

      <Button className="w-full" onClick={send} disabled={busy}>
        <Send className="mr-2 h-4 w-4" />
        {busy ? 'Sending…' : 'Send anonymously'}
      </Button>
    </div>
  );
}