import React, { useEffect, useState } from 'react';
import { Clock, Copy, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { combineDateTime } from '@/lib/compass';

const ORIGIN = window.location.origin;

export default function AdminTonightTab({ event }) {
  const [rows, setRows] = useState([]);
  const [providers, setProviders] = useState([]);
  const [addId, setAddId] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    const [epPage, providerPage] = await Promise.all([
      base44.entities.EventProvider.filter({ event_id: event.id }, { sort: 'showcase_order', limit: 30 }),
      base44.entities.Provider.list({ sort: 'name', limit: 200 }),
    ]);
    setRows(epPage.items);
    setProviders(providerPage.items);
  }

  useEffect(() => {
    load();
  }, [event.id]);

  const nameOf = (id) => providers.find((p) => p.id === id)?.name || 'Provider';
  const unassigned = providers.filter((p) => !rows.some((r) => r.provider_id === p.id));

  function edit(id, key, value) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  async function saveRow(row) {
    await base44.entities.EventProvider.update(row.id, {
      table_number: row.table_number,
      showcase_title: row.showcase_title,
      showcase_description: row.showcase_description,
      showcase_time: row.showcase_time,
      showcase_order: Number(row.showcase_order) || 0,
      is_active: row.is_active !== false,
    });
    load();
  }

  async function addProvider() {
    if (!addId) return;
    await base44.entities.EventProvider.create({
      event_id: event.id,
      provider_id: addId,
      table_number: String(rows.length + 1),
      showcase_order: rows.length + 1,
      is_active: true,
    });
    setAddId('');
    load();
  }

  async function removeRow(id) {
    await base44.entities.EventProvider.delete(id);
    load();
  }

  async function buildTimes() {
    const base = combineDateTime(event.date, event.welcome_time || event.start_time || '18:00');
    if (!base) return;
    const start = new Date(base.getTime() + 10 * 60000);
    const per = Math.max(Number(event.showcases_at_a_time) || 1, 1);
    const slot = Number(event.slot_length_minutes) || 20;
    const ordered = [...rows].sort((a, b) => (Number(a.showcase_order) || 0) - (Number(b.showcase_order) || 0));
    const updates = ordered.map((row, index) => {
      const at = new Date(start.getTime() + Math.floor(index / per) * slot * 60000);
      const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
      return { id: row.id, showcase_time: time };
    });
    if (updates.length) await base44.entities.EventProvider.bulkUpdate(updates);
    load();
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  async function shiftRunningBehind() {
    const now = Date.now();
    const ordered = [...rows].sort((a, b) => (Number(a.showcase_order) || 0) - (Number(b.showcase_order) || 0));
    const updates = [];
    const shifted = [];
    ordered.forEach((row) => {
      const at = combineDateTime(event.date, row.showcase_time);
      if (!at || at.getTime() <= now) return;
      const moved = new Date(at.getTime() + 10 * 60000);
      updates.push({
        id: row.id,
        showcase_time: `${String(moved.getHours()).padStart(2, '0')}:${String(moved.getMinutes()).padStart(2, '0')}`,
      });
      shifted.push({
        event_provider_id: row.id,
        remind_at: new Date(moved.getTime() - (Number(event.reminder_lead_minutes) || 5) * 60000).toISOString(),
      });
    });
    if (!updates.length) return;
    await base44.entities.EventProvider.bulkUpdate(updates);
    for (const row of shifted) {
      await base44.entities.Reminder.updateMany(
        { event_id: event.id, event_provider_id: row.event_provider_id, status: 'pending' },
        { $set: { remind_at: row.remind_at } }
      );
    }
    load();
  }

  const checkInUrl = `${ORIGIN}/check-in?event=${event.id}`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Run of show</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {event.slot_length_minutes} min per showcase, {event.showcases_at_a_time} at a time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={buildTimes}>
              <Sparkles className="mr-1 h-4 w-4" /> Fill in times
            </Button>
            <Button size="sm" variant="outline" onClick={shiftRunningBehind}>
              <Clock className="mr-1 h-4 w-4" /> Running behind +10
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Fill in times sets each showcase from the welcome time. Running behind +10 pushes every remaining slot
          ten minutes later. Edit a row, then tap Save.
        </p>
      </div>

      {rows.map((row) => (
        <div key={row.id} className="space-y-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-lg">{nameOf(row.provider_id)}</p>
            <Button size="sm" variant="outline" onClick={() => removeRow(row.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={row.table_number}
              onChange={(e) => edit(row.id, 'table_number', e.target.value)}
              placeholder="Table #"
            />
            <Input
              value={row.showcase_time}
              onChange={(e) => edit(row.id, 'showcase_time', e.target.value)}
              placeholder="18:10"
            />
          </div>
          <Input
            value={row.showcase_title}
            onChange={(e) => edit(row.id, 'showcase_title', e.target.value)}
            placeholder="Showcase title"
          />
          <Input
            value={row.showcase_description}
            onChange={(e) => edit(row.id, 'showcase_description', e.target.value)}
            placeholder="One-line description"
          />
          <Button onClick={() => saveRow(row)}>
            <Save className="mr-1 h-4 w-4" /> Save this stop
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <select
          value={addId}
          onChange={(e) => setAddId(e.target.value)}
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Choose a provider to add…</option>
          {unassigned.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button onClick={addProvider}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Signs and QR codes</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Turn each link into a QR code and print it. Guests scan and land on the right screen.
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={checkInUrl} className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => copy(checkInUrl, 'checkin')}>
              {copied === 'checkin' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Check-in sign at the entrance.</p>
        </div>
      </div>
    </div>
  );
}