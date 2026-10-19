import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField, TextAreaField, TextField, ToggleField } from '@/components/admin/fields';

const NUMERIC = [
  'capacity',
  'slot_length_minutes',
  'showcases_at_a_time',
  'gift_suggested_amount',
  'reminder_lead_minutes',
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'live', label: 'Live' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminEventsTab({ event, onChanged }) {
  const [form, setForm] = useState(event);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(event);
  }, [event]);

  if (!form) return null;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  function updateRun(index, key, value) {
    const next = [...(form.run_of_show || [])];
    next[index] = { ...next[index], [key]: value };
    setForm((f) => ({ ...f, run_of_show: next }));
  }

  function addRun() {
    setForm((f) => ({ ...f, run_of_show: [...(f.run_of_show || []), { time: '', label: '' }] }));
  }

  function removeRun(index) {
    setForm((f) => ({ ...f, run_of_show: (f.run_of_show || []).filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    const { id, created_date, updated_date, created_by_id, ...data } = form;
    NUMERIC.forEach((key) => {
      if (data[key] !== undefined && data[key] !== '') data[key] = Number(data[key]);
    });
    await base44.entities.Event.update(id, data);
    setSaving(false);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <TextField label="Event title" value={form.title} onChange={set('title')} />
      <TextField
        label="Theme"
        value={form.awareness_theme}
        onChange={set('awareness_theme')}
        placeholder="Grateful & Grounded"
      />
      <TextField label="Host" value={form.host} onChange={set('host')} placeholder="Dani" />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Date" type="date" value={form.date} onChange={set('date')} />
        <TextField label="Capacity" type="number" value={form.capacity} onChange={set('capacity')} />
      </div>
      <TextField label="Venue" value={form.venue} onChange={set('venue')} />
      <TextAreaField
        label="Description / tagline"
        value={form.description}
        onChange={set('description')}
        rows={2}
      />
      <SelectField label="Status" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />

      <div className="grid grid-cols-2 gap-2">
        <TextField label="Doors" value={form.start_time} onChange={set('start_time')} placeholder="17:30" />
        <TextField label="Welcome" value={form.welcome_time} onChange={set('welcome_time')} placeholder="17:30" />
        <TextField label="Last call" value={form.last_call_time} onChange={set('last_call_time')} placeholder="19:15" />
        <TextField label="Ends" value={form.end_time} onChange={set('end_time')} placeholder="20:00" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Check-in closes"
          value={form.check_in_closes_at}
          onChange={set('check_in_closes_at')}
          placeholder="19:15"
        />
        <TextField
          label="Feedback opens"
          value={form.feedback_opens_at}
          onChange={set('feedback_opens_at')}
          placeholder="19:30"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Showcase length (min)"
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
        label="Suggested gift ($)"
        type="number"
        value={form.gift_suggested_amount}
        onChange={set('gift_suggested_amount')}
      />

      <TextField
        label="Reminder lead (min)"
        type="number"
        value={form.reminder_lead_minutes}
        onChange={set('reminder_lead_minutes')}
      />

      <TextField label="Waitlist message" value={form.waitlist_message} onChange={set('waitlist_message')} />

      <ToggleField label="Check-in open" checked={form.check_in_open} onChange={set('check_in_open')} />

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Run of show</p>
          <Button size="sm" variant="outline" onClick={addRun}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {(form.run_of_show || []).map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={row.time}
                onChange={(e) => updateRun(index, 'time', e.target.value)}
                placeholder="17:30"
                className="w-24"
              />
              <Input
                value={row.label}
                onChange={(e) => updateRun(index, 'label', e.target.value)}
                placeholder="Welcome"
              />
              <Button size="sm" variant="outline" onClick={() => removeRun(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!(form.run_of_show || []).length && (
            <p className="text-xs text-muted-foreground">Add the moments guests should see on Tonight.</p>
          )}
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving…' : 'Save event'}
      </Button>
    </div>
  );
}