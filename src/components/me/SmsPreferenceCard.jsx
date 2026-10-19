import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function SmsPreferenceCard({ attendee, onToggle, busy }) {
  const stamp = attendee.text_opt_in_at
    ? new Date(attendee.text_opt_in_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-heading text-xl">
        <MessageSquare className="h-5 w-5 text-accent-strong" /> Texts
      </p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Text me event reminders. Msg &amp; data rates may apply. Reply STOP to opt out.
          {stamp && attendee.text_opt_in ? ` Opted in ${stamp}.` : ''}
        </p>
        <Switch checked={Boolean(attendee.text_opt_in)} onCheckedChange={onToggle} disabled={busy} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Text reminders need carrier approval for the Therapy Hour &amp; Co. number. Until that is live, reminders show
        up in the app itself.
      </p>
    </section>
  );
}