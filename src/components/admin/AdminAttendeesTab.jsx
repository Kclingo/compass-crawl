import React, { useCallback, useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/compass';

const HEADERS = [
  'full_name',
  'email',
  'mobile',
  'status',
  'checked_in_at',
  'text_opt_in',
  'text_opt_in_at',
  'gift_status',
  'gift_amount',
  'cause',
  'age_range',
  'zip_code',
  'referral_source',
  'first_crawl',
];

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl">{value}</p>
    </div>
  );
}

function GroupList({ title, rows, keyField }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-1 text-xs">
        {rows.map((row) => (
          <li key={row[keyField] || 'none'} className="flex justify-between gap-2">
            <span>{row[keyField] || 'Not given'}</span>
            <span className="text-muted-foreground">{row.count}</span>
          </li>
        ))}
        {!rows.length && <li className="text-muted-foreground">No answers yet.</li>}
      </ul>
    </div>
  );
}

export default function AdminAttendeesTab({ event }) {
  const [stats, setStats] = useState(null);
  const [causes, setCauses] = useState([]);
  const [ages, setAges] = useState([]);
  const [sources, setSources] = useState([]);
  const [guests, setGuests] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [active, waitlist, arrived, gifts, causeRows, charityPage, ageRows, sourceRows] = await Promise.all([
      base44.entities.Attendee.count({ event_id: event.id, status: 'active' }),
      base44.entities.Attendee.count({ event_id: event.id, status: 'waitlist' }),
      base44.entities.Attendee.count({ event_id: event.id, status: 'active', checked_in_at: { $exists: true } }),
      base44.entities.Attendee.aggregate({
        query: { event_id: event.id, gift_status: 'paid' },
        sum: 'gift_amount',
      }),
      base44.entities.CharityPick.aggregate({ query: { event_id: event.id }, groupBy: 'charity_id', sum: 'amount' }),
      base44.entities.Charity.list({ sort: 'sort_order', limit: 20 }),
      base44.entities.Demographic.aggregate({ query: { event_id: event.id }, groupBy: 'age_range' }),
      base44.entities.Demographic.aggregate({ query: { event_id: event.id }, groupBy: 'referral_source' }),
    ]);

    const names = {};
    charityPage.items.forEach((c) => {
      names[c.id] = c.name;
    });
    setCauses(
      (causeRows.rows || []).map((row) => ({
        charity_id: row.charity_id,
        name: names[row.charity_id] || 'Cause',
        count: row.count,
        total: row.sum_amount || 0,
      }))
    );
    setAges(ageRows.rows || []);
    setSources(sourceRows.rows || []);
    setStats({
      active,
      waitlist,
      arrived,
      gifts: gifts.rows?.[0]?.sum_gift_amount || 0,
      capacity: Number(event.capacity || 40),
    });
    await loadGuests();
  }, [event.id, event.capacity]);

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

  useEffect(() => {
    load();
  }, [load]);

  async function toggleCheckIn(row) {
    await base44.entities.Attendee.update(row.id, {
      checked_in_at: row.checked_in_at ? '' : new Date().toISOString(),
    });
    load();
  }

  async function exportCsv() {
    const guests = [];
    let cursor;
    let hasMore = true;
    while (hasMore) {
      const page = await base44.entities.Attendee.filter(
        { event_id: event.id },
        { sort: '-created_date', limit: 200, cursor }
      );
      guests.push(...page.items);
      cursor = page.next_cursor;
      hasMore = page.has_more;
    }

    const picks = {};
    (await base44.entities.CharityPick.filter({ event_id: event.id }, { limit: 500 })).items.forEach((p) => {
      picks[p.attendee_id] = p.charity_id;
    });
    const charityPage = await base44.entities.Charity.list({ sort: 'sort_order', limit: 20 });
    const names = {};
    charityPage.items.forEach((c) => {
      names[c.id] = c.name;
    });

    const demographics = {};
    (await base44.entities.Demographic.filter({ event_id: event.id }, { limit: 500 })).items.forEach((d) => {
      demographics[d.attendee_id] = d;
    });

    const csv = [
      HEADERS.join(','),
      ...guests.map((guest) => {
        const demo = demographics[guest.id] || {};
        const row = {
          ...guest,
          cause: names[picks[guest.id]] || '',
          age_range: demo.age_range || '',
          zip_code: demo.zip_code || '',
          referral_source: demo.referral_source || '',
          first_crawl: demo.first_crawl || '',
        };
        return HEADERS.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',');
      }),
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
        <Stat label="Passes" value={stats ? `${stats.active} / ${stats.capacity}` : '—'} />
        <Stat label="Checked in" value={stats?.arrived ?? '—'} />
        <Stat label="On the waitlist" value={stats?.waitlist ?? '—'} />
        <Stat label="Gifts raised" value={stats ? money(stats.gifts) : '—'} />
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Cause totals</p>
        <ul className="mt-2 space-y-1 text-xs">
          {causes.map((row) => (
            <li key={row.charity_id} className="flex justify-between gap-2">
              <span>{row.name}</span>
              <span className="text-muted-foreground">
                {row.count} pick{row.count === 1 ? '' : 's'} · {money(row.total)}
              </span>
            </li>
          ))}
          {!causes.length && <li className="text-muted-foreground">No causes picked yet.</li>}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GroupList title="Age range" rows={ages} keyField="age_range" />
        <GroupList title="Heard about us" rows={sources} keyField="referral_source" />
      </div>

      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a guest"
          onKeyDown={(e) => e.key === 'Enter' && loadGuests(search.trim())}
        />
        <Button variant="outline" onClick={() => loadGuests(search.trim())}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-2">
        {guests.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{row.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.email} · {row.status === 'waitlist' ? 'waitlist' : row.text_opt_in ? 'texts on' : 'texts off'}
                {row.gift_status === 'paid' ? ` · gifted ${money(row.gift_amount)}` : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant={row.checked_in_at ? 'secondary' : 'outline'}
              onClick={() => toggleCheckIn(row)}
            >
              {row.checked_in_at ? 'Arrived' : 'Mark arrived'}
            </Button>
          </li>
        ))}
        {!guests.length && <li className="text-sm text-muted-foreground">No guests yet.</li>}
      </ul>
    </div>
  );
}