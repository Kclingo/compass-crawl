import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export function TextField({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3, className = '' }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}

export function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={Boolean(checked)} onCheckedChange={onChange} />
    </div>
  );
}