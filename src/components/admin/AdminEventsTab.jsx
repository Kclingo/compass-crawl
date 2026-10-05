import React, { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField, TextAreaField, TextField, ToggleField } from '@/components/admin/fields';

const NUMERIC = [
  'donation_amount',
  'general_price',
  'early_bird_price',
  'early_bird_limit',
  'ceiling_price',
  'ticket_cap',
  'slot_length_minutes',
  'showcases_at_a_time',
  'fee_amount',
];

export default function AdminEventsTab({ event, onChanged }) {
  const [form, setForm] = useState(event);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setForm(event);
    setOpen(Boolean(event?.feedback_open));
  }, [event]);

  if (!form) return null;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function updatePromo(index, key, value) {
    const next = [...(form.promo_codes || [])];
    next[index] = { ...next[index], [key]: key === 'percent_off' ? Number(value) : value };
    setForm((f) => ({ ...f, promo_codes: next }));
  }

  async function save() {
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    NUMERIC.forEach((key) => {
      if (data[key] !== undefined && data[key] !== '') data[key] = Number(data[key]);
    });
    await base44.entities.Event.update(id, data);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <TextField label="Event title" value={form.title} onChange={set('title')} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Date" type="date" value={form.date} onChange={set('date')} />
        <TextField label="Venue" value={form.venue} onChange={set('venue')} />
      </div>
      <TextField label="Awareness theme" value={form.awareness_theme} onChange={set('awareness_theme')} />
      <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
      <SelectField
        label="Status"
        value={form.status}
        onChange={set('status')}
        options={[
          { value: 'draft', label: 'Draft — not on sale' },
          { value: 'live', label: 'Live — on sale tonight' },
          { value: 'closed', label: 'Closed — show totals' },
        ]}
      />

      <div className="grid grid-cols-3 gap-3">
        <TextField label="Doors" value={form.start_time} onChange={set('start_time')} placeholder="17:30" />
        <TextField label="Welcome" value={form.welcome_time} onChange={set('welcome_time')} placeholder="18:00" />
        <TextField label="Last call" value={form.last_call_time} onChange={set('last_call_time')} placeholder="19:30" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <TextField label="General $" type="number" value={form.general_price} onChange={set('general_price')} />
        <TextField label="Early bird $" type="number" value={form.early_bird_price} onChange={set('early_bird_price')} />
        <TextField label="Ceiling $" type="number" value={form.ceiling_price} onChange={set('ceiling_price')} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TextField label="Early bird limit" type="number" value={form.early_bird_limit} onChange={set('early_bird_limit')} />
        <TextField label="Early bird ends" type="date" value={form.early_bird_ends} onChange={set('early_bird_ends')} />
        <TextField label="Ticket cap" type="number" value={form.ticket_cap} onChange={set('ticket_cap')} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <TextField label="Donation $" type="number" value={form.donation_amount} onChange={set('donation_amount')} />
        <TextField
          label="Slot length (min)"
          type="number"
          value={form.slot_length_minutes}
          onChange={set('slot_length_minutes')}
        />
        <TextField
          label="Showcases at a time"
          type="number"
          value={form.showcases_at_a_time}
          onChange={set('showcases_at_a_time')}
        />
      </div>

      <TextField
        label="Card fee passed to buyer ($)"
        type="number"
        value={form.fee_amount}
        onChange={set('fee_amount')}
      />

      <ToggleField
        label="Pass processing fees to the buyer"
        hint="Keeps the donation whole."
        checked={form.pass_fees_to_buyer}
        onChange={set('pass_fees_to_buyer')}
      />
      <ToggleField label="Check-in open" checked={form.check_in_open} onChange={set('check_in_open')} />
      <ToggleField
        label="Feedback open"
        hint="Guests can rate the night and leave notes."
        checked={form.feedback_open}
        onChange={set('feedback_open')}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Promo codes</p>
        <div className="mt-3 space-y-2">
          {(form.promo_codes || []).map((promo, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={promo.code}
                onChange={(e) => updatePromo(index, 'code', e.target.value.toUpperCase())}
                placeholder="CODE"
              />
              <Input
                type="number"
                className="w-20"
                value={promo.percent_off}
                onChange={(e) => updatePromo(index, 'percent_off', e.target.value)}
              />
              <Input
                value={promo.label}
                onChange={(e) => updatePromo(index, 'label', e.target.value)}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => set('promo_codes')([...(form.promo_codes || []), { code: '', percent_off: 10, label: '' }])}
        >
          <Plus className="mr-1 h-4 w-4" /> Add code
        </Button>
      </div>

      <Button className="w-full" onClick={save}>
        <Save className="mr-2 h-4 w-4" /> Save event
      </Button>
    </div>
  );
}