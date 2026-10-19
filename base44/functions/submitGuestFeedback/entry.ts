import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function atEventTime(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) return null;
  const parts = String(timeStr).split(':').map(Number);
  const at = new Date(dateStr + 'T00:00:00');
  at.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
  return at;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to send feedback' }, { status: 401 });

    const body = await req.json();
    const attendeeId = body && body.attendee_id;
    if (!attendeeId) return Response.json({ error: 'attendee_id is required' }, { status: 400 });

    // User-scoped read: only a pass this guest owns comes back.
    const mine = await base44.entities.Attendee.filter({ id: attendeeId }, { limit: 1 });
    const attendee = (mine.items || [])[0];
    if (!attendee) return Response.json({ error: 'Pass not found' }, { status: 404 });
    if (!attendee.checked_in_at) {
      return Response.json({ error: 'Feedback is for guests who checked in.' }, { status: 403 });
    }

    const event = await base44.asServiceRole.entities.Event.get(attendee.event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const opensAt = atEventTime(event.date, event.feedback_opens_at);
    if (opensAt && event.status !== 'closed' && Date.now() < opensAt.getTime()) {
      return Response.json({ error: 'Feedback is not open yet.' }, { status: 403 });
    }

    const already = await base44.asServiceRole.entities.FeedbackReceipt.count({
      event_id: event.id,
      attendee_id: attendee.id,
      submitted: true,
    });
    if (already > 0) {
      return Response.json({ already: true });
    }

    const rating = Number(body.overall_rating || 0);
    await base44.asServiceRole.entities.Feedback.create({
      event_id: event.id,
      overall_rating: Math.min(Math.max(rating, 0), 5),
      favorite_stop: (body.favorite_stop ? String(body.favorite_stop) : '').slice(0, 400),
      improvement: (body.improvement ? String(body.improvement) : '').slice(0, 400),
      would_return: ['yes', 'maybe', 'no'].includes(body.would_return) ? body.would_return : 'maybe',
    });

    await base44.asServiceRole.entities.FeedbackReceipt.create({
      event_id: event.id,
      attendee_id: attendee.id,
      user_id: user.id,
      submitted: true,
      submitted_at: new Date().toISOString(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('submitGuestFeedback failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}