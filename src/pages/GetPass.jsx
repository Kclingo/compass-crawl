import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SelectField, TextField } from '@/components/admin/fields';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import BackLink from '@/components/BackLink';
import StepHint from '@/components/StepHint';

const OPT_IN_COPY = 'Text me event reminders. Msg & data rates may apply. Reply STOP to opt out.';
const NOT_SAYING = 'Prefer not to say';

const AGE_RANGES = ['Under 25', '25–34', '35–44', '45–54', '55+', NOT_SAYING];
const REFERRALS = ['Word of mouth', 'Instagram', 'A provider told me', 'Therapy Hour & Co.', 'Other', NOT_SAYING];
const FIRST_CRAWL = ['Yes, my first Crawl', 'No, I have been before', NOT_SAYING];

export default function GetPass() {
  const navigate = useNavigate();
  const { event, loading } = useCurrentEvent();
  const { attendee, loading: passLoading } = useMyPass(event?.id);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    eighteen_confirmed: false,
    text_opt_in: false,
    age_range: '',
    zip_code: '',
    referral_source: '',
    first_crawl: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [seats, setSeats] = useState(null);
  const [joinEmail, setJoinEmail] = useState('');

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    base44.auth.me().then((user) => {
      setForm((f) => ({ ...f, full_name: f.full_name || user.full_name || '', email: f.email || user.email || '' }));
      setJoinEmail((current) => current || user.email || '');
    });
  }, []);

  useEffect(() => {
    if (attendee) navigate('/pass', { replace: true });
  }, [attendee, navigate]);

  useEffect(() => {
    if (!event?.id) return;
    const capacity = Number(event.capacity || 40);
    base44.entities.Attendee.count({ event_id: event.id, status: 'active' }).then((taken) =>
      setSeats(Math.max(capacity - taken, 0))
    );
  }, [event?.id, event?.capacity]);

  async function submit() {
    setError('');
    if (!form.full_name.trim() || !form.email.trim() || !form.mobile.trim()) {
      setError('Full name, email and mobile number are all required.');
      return;
    }
    if (!form.eighteen_confirmed) {
      setError('Please confirm you are 18 or older.');
      return;
    }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('claimGuestPass', {
        event_id: event.id,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        eighteen_confirmed: form.eighteen_confirmed,
        text_opt_in: form.text_opt_in,
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);

      const pass = data.attendee;
      const answered = [form.age_range, form.referral_source, form.first_crawl].some(Boolean) || form.zip_code.trim();
      if (pass && answered) {
        const user = await base44.auth.me();
        await base44.entities.Demographic.create({
          event_id: event.id,
          attendee_id: pass.id,
          user_id: user.id,
          age_range: form.age_range,
          zip_code: form.zip_code.trim(),
          referral_source: form.referral_source,
          first_crawl: form.first_crawl,
        });
      }

      if (!data.waitlist) {
        base44.functions.invoke('sendPassConfirmation', { attendee_id: pass.id }).catch(() => {});
      }

      if (data.waitlist) {
        setWaitlisted(true);
        setBusy(false);
      } else {
        navigate('/cause');
      }
    } catch (err) {
      setError(err.message || 'That did not go through. Try again in a moment.');
      setBusy(false);
    }
  }

  async function joinWaitlist() {
    setError('');
    if (!joinEmail.trim()) {
      setError('Add the email we should use to reach you.');
      return;
    }
    setBusy(true);
    try {
      const response = await base44.functions.invoke('claimGuestPass', {
        event_id: event.id,
        email: joinEmail.trim(),
        waitlist_only: true,
      });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setWaitlisted(true);
      setBusy(false);
    } catch (err) {
      setError(err.message || 'That did not go through. Try again in a moment.');
      setBusy(false);
    }
  }

  if (loading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (!event) return <p className="text-sm text-muted-foreground">The next Crawl is being planned.</p>;

  if (seats === 0 && !attendee) {
    return (
      <div className="space-y-5">
        <BackLink to="/" label="Tonight" />
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">This Crawl is full</h1>
          <p className="mt-1 font-tagline text-lg italic text-muted-foreground">
            {event.awareness_theme ? `${event.awareness_theme} · ` : ''}
            {event.title}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {event.waitlist_message || 'This Crawl is full. Join the list for next month.'}
          </p>
          <TextField label="Email" type="email" value={joinEmail} onChange={setJoinEmail} />
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button size="lg" className="w-full" onClick={joinWaitlist} disabled={busy}>
            {busy ? 'Adding you to the list…' : 'Join the list'}
          </Button>
        </div>
      </div>
    );
  }

  if (waitlisted) {
    return (
      <div className="space-y-5">
        <BackLink to="/" label="Tonight" />
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">You&rsquo;re on the list</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.waitlist_message || 'This Crawl is full. Join the list for next month.'}
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/me">See my details</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink to="/" label="Tonight" />
      <div>
        <h1 className="font-heading text-3xl uppercase tracking-[0.14em]">Claim your pass</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Free to join. {seats !== null ? `${seats} of ${event.capacity || 40} seats left.` : ''}
        </p>
      </div>

      <StepHint current={1} />

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Your details · all three required
        </p>
        <TextField label="Full name" value={form.full_name} onChange={set('full_name')} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} />
        <TextField
          label="Mobile"
          type="tel"
          value={form.mobile}
          onChange={set('mobile')}
          placeholder="(555) 555-0123"
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={form.eighteen_confirmed}
            onCheckedChange={(v) => set('eighteen_confirmed')(Boolean(v))}
            className="mt-0.5"
          />
          <span className="text-sm">
            I confirm I am 18 or older.
            <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> This is a wellness social, not a care setting.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={form.text_opt_in}
            onCheckedChange={(v) => set('text_opt_in')(Boolean(v))}
            className="mt-0.5"
          />
          <span className="text-sm">{OPT_IN_COPY}</span>
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Optional, helps us plan</p>
        <SelectField
          label="Age range"
          value={form.age_range}
          onChange={set('age_range')}
          options={AGE_RANGES.map((o) => ({ value: o, label: o }))}
        />
        <TextField label="Zip code" value={form.zip_code} onChange={set('zip_code')} placeholder="Optional" />
        <SelectField
          label="How did you hear about us?"
          value={form.referral_source}
          onChange={set('referral_source')}
          options={REFERRALS.map((o) => ({ value: o, label: o }))}
        />
        <SelectField
          label="Is this your first Crawl?"
          value={form.first_crawl}
          onChange={set('first_crawl')}
          options={FIRST_CRAWL.map((o) => ({ value: o, label: o }))}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
        {busy ? 'Saving your seat…' : 'Claim my free pass'}
      </Button>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" /> No payment needed. A gift is always optional.
      </p>
    </div>
  );
}