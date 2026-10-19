import React, { useCallback, useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { downloadCsv, fetchAll } from '@/lib/csv';
import { money } from '@/lib/compass';

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  );
}

function ExportButton({ label, onClick }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <Download className="mr-1 h-4 w-4" /> {label}.csv
    </Button>
  );
}

export default function AdminGuestDesk({ event }) {
  const [metrics, setMetrics] = useState(null);
  const [causes, setCauses] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');

  const loadGuests = useCallback(
    async (term) => {
      const query = term
        ? { event_id: event.id, full_name: { $regex: term, $options: 'i' } }
        : { event_id: event.id };
      const page = await base44.entities.Attendee.filter(query, { sort: '-created_date', limit: 100 });
      setGuests(page.items);
    },
    [event.id]
  );

  const load = useCallback(async () => {
    const [arrived, optIns, gifts, causeRows, charities, ratingRows] = await Promise.all([
      base44.entities.Attendee.count({ event_id: event.id, status: 'active', checked_in_at: { $gt: '' } }),
      base44.entities.Attendee.count({ event_id: event.id, text_opt_in: true }),
      base44.entities.Attendee.aggregate({ query: { event_id: event.id, gift_status: 'paid' }, sum: 'gift_amount' }),
      base44.entities.CharityPick.aggregate({ query: { event_id: event.id }, groupBy: 'charity_id', sum: 'amount' }),
      base44.entities.Charity.list({ sort: 'sort_order', limit: 20 }),
      base44.entities.Feedback.aggregate({ query: { event_id: event.id }, groupBy: 'overall_rating' }),
    ]);

    const names = {};
    charities.items.forEach((c) => {
      names[c.id] = c.name;
    });
    setCauses(
      (causeRows.rows || []).map((row) => ({
        name: names[row.charity_id] || 'Cause',
        count: row.count,
        total: row.sum_amount || 0,
      }))
    );

    const buckets = [1, 2, 3, 4, 5].map((star) => {
      const row = (ratingRows.rows || []).find((r) => Number(r.overall_rating) === star);
      return { star, count: row ? row.count : 0 };
    });
    setRatings(buckets);
    const responses = buckets.reduce((sum, b) => sum + b.count, 0);
    const weighted = buckets.reduce((sum, b) => sum + b.star * b.count, 0);

    setMetrics({
      arrived,
      optIns,
      gifts: gifts.rows?.[0]?.sum_gift_amount || 0,
      responses,
      average: responses ? weighted / responses : null,
    });
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => loadGuests(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, loadGuests]);

  async function toggleCheckIn(row) {
    await base44.entities.Attendee.update(row.id, {
      checked_in_at: row.checked_in_at ? '' : new Date().toISOString(),
    });
    await Promise.all([load(), loadGuests(search.trim())]);
  }

  async function exportGuests() {
    const rows = await fetchAll((cursor) =>
      base44.entities.Attendee.filter({ event_id: event.id }, { limit: 200, cursor })
    );
    downloadCsv(
      `guests-${event.date}.csv`,
      ['full_name', 'email', 'mobile', 'status', 'checked_in_at', 'text_opt_in', 'text_opt_in_at', 'gift_status', 'gift_amount'],
      rows
    );
  }

  function exportCauses() {
    downloadCsv(
      `causes-${event.date}.csv`,
      ['cause', 'picks', 'dollars_raised'],
      causes.map((c) => ({ cause: c.name, picks: c.count, dollars_raised: c.total }))
    );
  }

  async function exportFeedback() {
    const rows = await fetchAll((cursor) =>
      base44.entities.Feedback.filter({ event_id: event.id }, { limit: 200, cursor })
    );
    downloadCsv(
      `feedback-${event.date}.csv`,
      ['overall_rating', 'favorite_stop', 'improvement', 'would_return', 'submitted_at'],
      rows.map((r) => ({ ...r, submitted_at: r.created_date }))
    );
  }

  async function exportDemographics() {
    const rows = await fetchAll((cursor) =>
      base44.entities.Demographic.filter({ event_id: event.id }, { limit: 200, cursor })
    );
    downloadCsv(`demographics-${event.date}.csv`, ['age_range', 'zip_code', 'referral_source', 'first_crawl'], rows);
  }

  const hidden = !metrics || metrics.responses < 5;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Checked in" value={metrics?.arrived ?? '—'} />
        <Metric label="Text opt-ins" value={metrics?.optIns ?? '—'} />
        <Metric label="$5 gifts" value={metrics ? money(metrics.gifts) : '—'} />
        <Metric label="Feedback" value={metrics?.responses ?? '—'} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Cause breakdown</p>
        <ul className="mt-2 space-y-1 text-sm">
          {causes.map((row) => (
            <li key={row.name} className="flex justify-between gap-2">
              <span className="truncate">{row.name}</span>
              <span className="text-muted-foreground">
                {row.count} pick{row.count === 1 ? '' : 's'} · {money(row.total)}
              </span>
            </li>
          ))}
          {!causes.length && <li className="text-muted-foreground">No causes picked yet.</li>}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Anonymous feedback</p>
          <p className="font-heading text-xl">{hidden ? '—' : metrics.average.toFixed(1)}</p>
        </div>
        {hidden ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Stays hidden until at least 5 guests answer, so nobody can be identified.
            {metrics ? ` ${metrics.responses} so far.` : ''}
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {[...ratings].reverse().map((bucket) => (
              <li key={bucket.star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-muted-foreground">{bucket.star}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full bg-accent-strong"
                    style={{ width: `${Math.round((bucket.count / metrics.responses) * 100)}%` }}
                  />
                </span>
                <span className="w-6 text-right text-muted-foreground">{bucket.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Greeter desk</p>
        <div className="mt-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a guest by name"
          />
        </div>
        <ul className="mt-3 space-y-2">
          {guests.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{row.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.status === 'waitlist' ? 'waitlist' : 'pass'}
                  {row.checked_in_at ? ` · in at ${new Date(row.checked_in_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                  {row.gift_status === 'paid' ? ` · gifted ${money(row.gift_amount)}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant={row.checked_in_at ? 'secondary' : 'outline'}
                onClick={() => toggleCheckIn(row)}
              >
                {row.checked_in_at ? 'Checked in' : 'Check in'}
              </Button>
            </li>
          ))}
          {!guests.length && <li className="text-sm text-muted-foreground">No guests match that name.</li>}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ExportButton label="Guests" onClick={exportGuests} />
        <ExportButton label="Causes" onClick={exportCauses} />
        <ExportButton label="Feedback" onClick={exportFeedback} />
        <ExportButton label="Demographics" onClick={exportDemographics} />
      </div>
    </div>
  );
}