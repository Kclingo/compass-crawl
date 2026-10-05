import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackLink({ to, label }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-accent-strong"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}