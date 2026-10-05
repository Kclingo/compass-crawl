import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleField } from '@/components/admin/fields';

export default function AdminCharitiesTab() {
  const [rows, setRows] = useState([]);

  async function load() {
    const page = await base44.entities.Charity.list({ sort: 'sort_order', limit: 50 });
    setRows(page.items);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(id, key, value) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  async function save(row) {
    const { id, created_date, updated_date, created_by_id, ...data } = row;
    data.sort_order = Number(data.sort_order) || 1;
    await base44.entities.Charity.update(id, data);
    load();
  }

  async function add() {
    await base44.entities.Charity.create({
      name: 'New nonprofit',
      description: 'One line on what they do.',
      sort_order: rows.length + 1,
      active: true,
    });
    load();
  }

  async function remove(id) {
    await base44.entities.Charity.delete(id);
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Guests pick one of these after payment. Each pick is a fixed donation.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="space-y-2 rounded-lg border border-border bg-card p-4">
          <Input value={row.name} onChange={(e) => edit(row.id, 'name', e.target.value)} placeholder="Nonprofit name" />
          <Input
            value={row.description}
            onChange={(e) => edit(row.id, 'description', e.target.value)}
            placeholder="One line on what they do"
          />
          <Input
            value={row.logo}
            onChange={(e) => edit(row.id, 'logo', e.target.value)}
            placeholder="Logo URL (optional)"
          />
          <div className="flex items-center gap-3">
            <Input
              type="number"
              className="w-24"
              value={row.sort_order}
              onChange={(e) => edit(row.id, 'sort_order', e.target.value)}
            />
            <Button size="sm" onClick={() => save(row)}>
              <Save className="mr-1 h-4 w-4" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => remove(row.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={add}>
        <Plus className="mr-2 h-4 w-4" /> Add nonprofit
      </Button>
    </div>
  );
}