import React, { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminRaffleTab({ event }) {
  const [entries, setEntries] = useState([]);
  const [draws, setDraws] = useState([]);
  const [prize, setPrize] = useState('Raffle prize');
  const [winner, setWinner] = useState(null);

  const load = useCallback(async () => {
    const providerCount = await base44.entities.EventProvider.count({ event_id: event.id, is_active: true });
    const stampRows = await base44.entities.Stamp.aggregate({
      query: { event_id: event.id },
      groupBy: 'ticket_id',
    });
    const eligibleIds = (stampRows.rows || [])
      .filter((row) => providerCount > 0 && (row.count || 0) >= providerCount)
      .map((row) => row.ticket_id);
    const tickets = eligibleIds.length
      ? await base44.entities.Ticket.filter({ id: { $in: eligibleIds } }, { limit: 200 })
      : { items: [] };
    setEntries(tickets.items.filter((t) => t.status !== 'cancelled'));
    const drawPage = await base44.entities.RaffleDraw.filter(
      { event_id: event.id },
      { sort: '-drawn_at', limit: 20 }
    );
    setDraws(drawPage.items);
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function draw(isRedraw) {
    if (!entries.length) return;
    const picked = entries[Math.floor(Math.random() * entries.length)];
    await base44.entities.RaffleDraw.create({
      event_id: event.id,
      prize,
      winning_ticket_id: picked.id,
      winner_name: picked.attendee_name,
      drawn_at: new Date().toISOString(),
      is_redraw: Boolean(isRedraw),
    });
    setWinner(picked);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Entries</p>
        <p className="mt-1 font-heading text-3xl">{entries.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Guests who collected every stamp. Everyone else is not in the draw.
        </p>
      </div>

      {winner && (
        <div className="rounded-lg border border-accent bg-secondary p-5 text-center text-secondary-foreground">
          <Trophy className="mx-auto h-7 w-7 text-accent" />
          <p className="mt-2 font-heading text-2xl">{winner.attendee_name}</p>
          <p className="text-xs">{winner.email}</p>
        </div>
      )}

      <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Prize" />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => draw(false)} disabled={!entries.length}>
          Draw a winner
        </Button>
        <Button variant="outline" onClick={() => draw(true)} disabled={!entries.length}>
          Redraw
        </Button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Draw history</p>
        <ul className="mt-2 space-y-2">
          {draws.map((d) => (
            <li key={d.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-medium">
                {d.winner_name} {d.is_redraw && <span className="text-xs text-muted-foreground">· redraw</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {d.prize} · {new Date(d.drawn_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            </li>
          ))}
          {!draws.length && <li className="text-sm text-muted-foreground">No draws yet.</li>}
        </ul>
      </div>
    </div>
  );
}