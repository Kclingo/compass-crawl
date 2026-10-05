import React, { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProviderAvatar from '@/components/ProviderAvatar';
import { TextAreaField } from '@/components/admin/fields';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  business: '',
  category: '',
  bio: '',
  services: '',
  booking_link: '',
  website: '',
  instagram: '',
  tiktok: '',
  linkedin: '',
  email: '',
  offer: '',
  photo: '',
  active: true,
};

export default function AdminProvidersTab() {
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const page = await base44.entities.Provider.list({ sort: 'name', limit: 200 });
    setProviders(page.items);
  }

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    setForm((f) => ({ ...f, photo: file_url }));
    setUploading(false);
  }

  async function save() {
    if (!form.name.trim()) return;
    if (form.id) {
      const { id, created_date, updated_date, created_by_id, ...data } = form;
      await base44.entities.Provider.update(id, data);
    } else {
      await base44.entities.Provider.create({ ...form, active: true });
    }
    setForm(EMPTY);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setForm(p)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
              form.id === p.id ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
            )}
          >
            <ProviderAvatar provider={p} className="h-6 w-6 text-[10px]" />
            {p.name}
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {form.id ? 'Edit provider' : 'New provider'}
          </p>
          <Button size="sm" variant="outline" onClick={() => setForm(EMPTY)}>
            <Plus className="mr-1 h-4 w-4" /> Blank
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <ProviderAvatar provider={form} className="h-14 w-14 text-lg" />
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Photo</Label>
            <Input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(e) => uploadPhoto(e.target.files?.[0])}
            />
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Name" />
          <Input value={form.business} onChange={(e) => set('business')(e.target.value)} placeholder="Business" />
        </div>
        <Input
          value={form.category}
          onChange={(e) => set('category')(e.target.value)}
          placeholder="Category (therapy, breathwork, nutrition, sound, skincare)"
        />
        <TextAreaField label="Short bio" value={form.bio} onChange={set('bio')} rows={2} />
        <TextAreaField label="Services" value={form.services} onChange={set('services')} rows={2} />
        <Input
          value={form.offer}
          onChange={(e) => set('offer')(e.target.value)}
          placeholder="Attendee offer, e.g. 10% off your first session"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={form.booking_link}
            onChange={(e) => set('booking_link')(e.target.value)}
            placeholder="Booking link"
          />
          <Input value={form.website} onChange={(e) => set('website')(e.target.value)} placeholder="Website" />
          <Input value={form.instagram} onChange={(e) => set('instagram')(e.target.value)} placeholder="Instagram" />
          <Input value={form.tiktok} onChange={(e) => set('tiktok')(e.target.value)} placeholder="TikTok" />
          <Input value={form.linkedin} onChange={(e) => set('linkedin')(e.target.value)} placeholder="LinkedIn" />
          <Input value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="Email" />
        </div>

        <Button className="w-full" onClick={save}>
          <Save className="mr-2 h-4 w-4" /> Save provider
        </Button>
      </div>
    </div>
  );
}