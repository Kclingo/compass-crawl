import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import StarRating from '@/components/StarRating';

export default function AdminFeedbackTab({ event }) {
  const [count, setCount] = useState(0);
  const [average, setAverage] = useState(null);
  const [receipts, setReceipts] = useState(0);
  const [sold, setSold] = useState(0);
  const [responses, setResponses] = useState([]);

  const load = useCallback(async () => {
    const [total, avg, submitted, tickets] = await Promise.all([
      base44.entities.Feedback.count({ event_id: event.id }),
      base44.entities.Feedback.aggregate({ query: { event_id: event.id }, avg: 'overall_rating' }),
      base44.entities.FeedbackReceipt.count({ event_id: event.id, submitted: true }),
      base44.entities.Attendee.count({ event_id: event.id, status: 'active' }),
    ]);
    setCount(total);
    setAverage(avg.rows?.[0]?.avg_overall_rating ?? null);
    setReceipts(submitted);
    setSold(tickets);
    const page = await base44.entities.Feedback.filter(
      { event_id: event.id },
      { sort: '-created_date', limit: 100 }
    );
    setResponses(page.items);
  }, [event.id]);

  useEffect(() => {
    load();
  }, [load]);

  const hidden = count < 5;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Answers</p>
          <p className="mt-1 font-heading text-2xl">{count}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Average</p>
          <p className="mt-1 font-heading text-2xl">{average ? average.toFixed(1) : '—'}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Response rate</p>
          <p className="mt-1 font-heading text-2xl">{sold ? `${Math.round((receipts / sold) * 100)}%` : '—'}</p>
        </div>
      </div>

      {hidden ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Results stay hidden until at least 5 guests answer, so nobody can be identified. {count} so far.
        </p>
      ) : (
        <ul className="space-y-3">
          {responses.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <StarRating size="h-4 w-4" value={row.overall_rating || 0} />
                <span className="text-xs capitalize text-muted-foreground">
                  Would return: {row.would_return}
                </span>
              </div>
              {row.favorite_stop && (
                <p className="mt-2 text-xs text-muted-foreground">Favourite stop: {row.favorite_stop}</p>
              )}
              {row.improvement && (
                <p className="mt-2 text-sm text-muted-foreground">Do differently: {row.improvement}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}