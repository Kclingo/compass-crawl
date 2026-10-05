import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { money } from '@/lib/compass';

export default function DonationReveal({ event }) {
  const [rows, setRows] = useState([]);
  const [seriesTotal, setSeriesTotal] = useState(0);
  const [tonightTotal, setTonightTotal] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const [byCharity, series, charities] = await Promise.all([
        base44.entities.CharityPick.aggregate({
          query: { event_id: event.id },
          groupBy: 'charity_id',
          sum: 'amount',
        }),
        base44.entities.CharityPick.aggregate({ sum: 'amount' }),
        base44.entities.Charity.list({ limit: 50 }),
      ]);
      if (!active) return;
      const names = {};
      charities.items.forEach((c) => {
        names[c.id] = c.name;
      });
      const mapped = (byCharity.rows || []).map((r) => ({
        name: names[r.charity_id] || 'Local nonprofit',
        amount: r.sum_amount || 0,
      }));
      setRows(mapped);
      setTonightTotal(mapped.reduce((sum, r) => sum + r.amount, 0));
      setSeriesTotal(series.rows?.[0]?.sum_amount || 0);
    })();
    return () => {
      active = false;
    };
  }, [event.id]);

  return (
    <section className="rounded-lg border border-accent/40 bg-primary p-5 text-primary-foreground">
      <p className="font-heading text-xl uppercase tracking-[0.2em] text-secondary">Tonight we gave</p>
      <p className="mt-1 font-heading text-4xl text-secondary">{money(tonightTotal)}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.name} className="flex justify-between gap-4">
            <span className="text-primary-foreground/80">{r.name}</span>
            <span className="font-medium text-secondary">{money(r.amount)}</span>
          </li>
        ))}
        {!rows.length && <li className="text-primary-foreground/70">No picks recorded yet.</li>}
      </ul>
      <p className="mt-4 border-t border-primary-foreground/20 pt-3 text-xs text-primary-foreground/70">
        Running series total: {money(seriesTotal)}
      </p>
    </section>
  );
}