import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/admin/fields';
import StarRating from '@/components/StarRating';
import BackLink from '@/components/BackLink';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import useEventProviders from '@/hooks/useEventProviders';
import { buildRunOfShow, isFeedbackOpen } from '@/lib/compass';

const RETURN_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'No' },
];

export default function Feedback() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { attendee, loading: passLoading } = useMyPass(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [receipt, setReceipt] = useState(null);
  const [overall, setOverall] = useState(0);
  const [favoriteStop, setFavoriteStop] = useState('');
  const [improvement, setImprovement] = useState('');
  const [wouldReturn, setWouldReturn] = useState('yes');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!attendee) return;
    base44.entities.FeedbackReceipt.filter({ attendee_id: attendee.id }, { limit: 1 }).then((page) =>
      setReceipt(page.items[0] || null)
    );
  }, [attendee]);

  if (eventLoading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">No Crawl to review.</p>;

  const open = isFeedbackOpen(event);

  if (!open) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-heading text-xl">Feedback opens later tonight</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Come back at the close and tell us how the night went. Everything you write is anonymous.
        </p>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/">Back to Tonight</Link>
        </Button>
      </div>
    );
  }

  if (!attendee) {
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
    setError('');
    setBusy(true);
    const response = await base44.functions.invoke('submitGuestFeedback', {
      attendee_id: attendee.id,
      overall_rating: overall,
      favorite_stop: favoriteStop,
      improvement,
      would_return: wouldReturn,
    });
    if (response.data?.error) {
      setError(response.data.error);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  }

  if (sent || receipt?.submitted) {
    return (
      <div className="rounded-lg border border-accent bg-card p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent-strong" />
        <p className="mt-2 font-heading text-xl">Thank you</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers went in anonymously, with no name attached.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link to="/">Back to Tonight</Link>
        </Button>
      </div>
    );
  }

  const stops = buildRunOfShow(event, eventProviders, providersById).filter((row) => row.time);

  return (
    <div className="space-y-5">
      <BackLink to="/" label="Tonight" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">How was tonight?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anonymous and quick: a rating, your favourite stop, one thing to change.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The night overall</Label>
        <div className="mt-3">
          <StarRating value={overall} onChange={setOverall} />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <SelectField
          label="Favourite stop"
          value={favoriteStop}
          onChange={setFavoriteStop}
          options={[
            { value: '', label: 'Pick one, or skip' },
            ...stops.map((row) => ({ value: row.label, label: row.label })),
          ]}
        />
        <div>
          <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            One thing to change
          </Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="Timing, layout, anything at all."
          />
        </div>
        <SelectField label="Would you come to another Crawl?" value={wouldReturn} onChange={setWouldReturn} options={RETURN_OPTIONS} />
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={send} disabled={busy}>
        <Send className="mr-2 h-4 w-4" />
        {busy ? 'Sending…' : 'Send anonymously'}
      </Button>
    </div>
  );
}