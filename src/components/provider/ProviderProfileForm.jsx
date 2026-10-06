import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProviderAvatar from '@/components/ProviderAvatar';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { toast } from '@/components/ui/use-toast';

const EDITABLE = [
  'name',
  'business',
  'category',
  'bio',
  'services',
  'offer',
  'booking_link',
  'website',
  'instagram',
  'tiktok',
  'linkedin',
  'email',
  'photo',
];

export default function ProviderProfileForm({ provider, user, onSaved }) {
  const [form, setForm] = useState({ ...(provider || {}), email: provider?.email || user.email });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, photo: file_url }));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const data = EDITABLE.reduce((acc, key) => {
      acc[key] = form[key] ?? '';
      return acc;
    }, { user_id: user.id });

    try {
      const record = provider?.id
        ? await base44.entities.Provider.update(provider.id, data)
        : await base44.entities.Provider.create(data);
      onSaved(record);
      toast({ title: 'Profile saved', description: 'Guests see these details on your provider page.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <ProviderAvatar provider={form} className="h-16 w-16 text-xl" />
        <div className="min-w-0">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Name" value={form.name} onChange={set('name')} placeholder="Your name" />
        <TextField
          label="Business"
          value={form.business}
          onChange={set('business')}
          placeholder="Business or practice"
        />
      </div>

      <TextField
        label="Category"
        value={form.category}
        onChange={set('category')}
        placeholder="therapy, breathwork, nutrition, sound, skincare"
      />

      <TextAreaField label="Short bio" value={form.bio} onChange={set('bio')} rows={3} />
      <TextAreaField label="Services" value={form.services} onChange={set('services')} rows={2} />

      <TextField
        label="Offer for crawl guests"
        value={form.offer}
        onChange={set('offer')}
        placeholder="10% off your first session"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Booking link" value={form.booking_link} onChange={set('booking_link')} />
        <TextField label="Website" value={form.website} onChange={set('website')} />
        <TextField label="Instagram" value={form.instagram} onChange={set('instagram')} />
        <TextField label="TikTok" value={form.tiktok} onChange={set('tiktok')} />
        <TextField label="LinkedIn" value={form.linkedin} onChange={set('linkedin')} />
        <TextField label="Contact email" value={form.email} onChange={set('email')} />
      </div>

      <Button className="w-full" onClick={save} disabled={saving || !form.name.trim()}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  );
}