import React, { useCallback, useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/compass';

const HEADERS = [
  'attendee_name',
  'email',
  'phone',
  'price_tier',
  'amount_paid',
  'checked_in_at',
  'age_range',
  'zip_code',
  'referral_source',
  'first_crawl',
  'text_opt_in',
];

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  );
}

export default function AdminAttendeesTab({ event }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ages, setAges] = useState([]);
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [sold, arrived, revenue, donations, ageRows, sourceRows] = await Promise.all([
      base44.entities.Ticket.count({ event_id: event.id, status: 'active' }),
      base44.entities.Ticket.count({ event_id: event.id, status: 'active', checked_in_at: { $exists: true } }),
      base44.entities.Ticket.aggregate({ query: { event_id: event.id, status: 'active' }, sum: 'amount_paid' }),
      base44.entities.CharityPick.aggregate({ query: { event_id: event.id }, sum: 'amount' }),
      base44.entities.Ticket.aggregate({ query: { event_id: event.id, status: 'active' }, groupBy: 'age_range' }),
      base44.entities.Ticket.aggregate({ query: { event_id: event.id, status: 'active' }, groupBy: 'referral_source' }),
    ]);
    setStats({
      sold,
      arrived,
      revenue: revenue.rows?.[0]?.sum_amount_paid || 0,
      donations: donations.rows?.[0]?.sum_amount || 0,
    });
    setAges(ageRows.rows || []);
    setSources(sourceRows.rows || []);
    const page = await base44.entities.Ticket.filter(
      { event_id: event.id, status: 'active' },
      { sort: '-created_date', limit: 100 }
    );
    setTickets(page.items);
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function runSearch() {
    if (!search.trim()) {
      load();
      return;
    }
    const page = await base44.entities.Ticket.filter(
      { event_id: event.id, attendee_name: { $regex: search.trim(), $options: 'i' } },
      { limit: 50 }
    );
    setTickets(page.items);
  }

  async function toggleCheckIn(row) {
    await base44.entities.Ticket.update(row.id, {
      checked_in_at: row.checked_in_at ? '' : new Date().toISOString(),
    });
    load();
  }

  async function exportCsv() {
    const rows = [];
    let cursor;
    let hasMore = true;
    while (hasMore) {
      const page = await base44.entities.Ticket.filter(
        { event_id: event.id, status: 'active' },
        { sort: '-created_date', limit: 200, cursor }
      );
      rows.push(...page.items);
      cursor = page.next_cursor;
      hasMore = page.has_more;
    }
    const csv = [
      HEADERS.join(','),
      ...rows.map((r) =>
        HEADERS.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `compass-crawl-${event.date}-guests.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Tickets" value={stats ? `${stats.sold} / ${event.ticket_cap}` : '—'} />
        <Stat label="Checked in" value={stats?.arrived ?? '—'} />
        <Stat label="Ticket revenue" value={stats ? money(stats.revenue) : '—'} />
        <Stat label="Donations raised" value={stats ? money(stats.donations) : '—'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Age range</p>
          <ul className="mt-2 space-y-1 text-xs">
            {ages.map((row) => (
              <li key={row.age_range || 'none'} className="flex justify-between gap-2">
                <span>{row.age_range || 'Not given'}</span>
                <span className="text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Heard about us</p>
          <ul className="mt-2 space-y-1 text-xs">
            {sources.map((row) => (
              <li key={row.referral_source || 'none'} className="flex justify-between gap-2">
                <span>{row.referral_source || 'Not given'}</span>
                <span className="text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a guest"
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <Button variant="outline" onClick={runSearch}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-2">
        {tickets.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{row.attendee_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.email} · {row.price_tier} · {money(row.amount_paid)}
              </p>
            </div>
            <Button size="sm" variant={row.checked_in_at ? 'secondary' : 'outline'} onClick={() => toggleCheckIn(row)}>
              {row.checked_in_at ? 'Arrived' : 'Mark arrived'}
            </Button>
          </li>
        ))}
        {!tickets.length && <li className="text-sm text-muted-foreground">No guests yet.</li>}
      </ul>
    </div>
  );
}