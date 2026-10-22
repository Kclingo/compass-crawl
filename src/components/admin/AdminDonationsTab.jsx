import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

function money(value) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export default function AdminDonationsTab({ event }) {
  const [charities, setCharities] = useState([]);
  const [picks, setPicks] = useState([]);
  const [paidGifts, setPaidGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [charityPage, pickPage, attendeePage] = await Promise.all([
      base44.entities.Charity.list({ sort: 'sort_order', limit: 50 }),
      base44.entities.CharityPick.filter({ event_id: event.id }, { limit: 500 }),
      base44.entities.Attendee.filter(
        { event_id: event.id, gift_status: 'paid' },
        { limit: 500 }
      ),
    ]);
    setCharities(charityPage.items);
    setPicks(pickPage.items);
    setPaidGifts(attendeePage.items);
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  const overall = paidGifts.reduce((sum, a) => sum + (Number(a.gift_amount) || 0), 0);

  const rows = charities
    .map((charity) => {
      const mine = picks.filter((p) => p.charity_id === charity.id);
      const total = mine.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      return {
        id: charity.id,
        name: charity.name,
        total,
        gifts: mine.filter((p) => Number(p.amount) > 0).length,
      };
    })
    .sort((a, b) => b.total - a.total);

  const attributed = rows.reduce((sum, r) => sum + r.total, 0);
  const unassigned = Math.max(overall - attributed, 0);
  const topTotal = rows[0]?.total || 0;
  const giftCount = paidGifts.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Donated overall · {event.title}
        </p>
        <p className="mt-1 font-heading text-4xl text-accent-strong">{money(overall)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {giftCount === 0
            ? 'No gifts yet.'
            : `${giftCount} gift${giftCount === 1 ? '' : 's'} · ${money(overall / giftCount)} average`}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Add the nonprofits guests can choose from in the Charities tab.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 flex-1 truncate font-heading text-lg">{row.name}</p>
                <p className="font-heading text-lg text-accent-strong">{money(row.total)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: topTotal > 0 ? `${Math.max((row.total / topTotal) * 100, row.total > 0 ? 4 : 0)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {row.gifts} gift{row.gifts === 1 ? '' : 's'}
                {overall > 0 ? ` · ${Math.round((row.total / overall) * 100)}% of total` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {unassigned > 0 && (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          {money(unassigned)} of gifts has not been assigned to a cause yet.
        </p>
      )}
    </div>
  );
}