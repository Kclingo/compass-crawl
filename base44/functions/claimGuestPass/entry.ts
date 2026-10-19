import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to claim a pass' }, { status: 401 });

    const body = await req.json();
    const eventId = body && body.event_id;
    const fullName = (body && body.full_name ? String(body.full_name) : '').trim();
    const email = (body && body.email ? String(body.email) : '').trim();
    const mobile = (body && body.mobile ? String(body.mobile) : '').trim();

    if (!eventId) return Response.json({ error: 'event_id is required' }, { status: 400 });
    if (!fullName || !email || !mobile) {
      return Response.json({ error: 'Full name, email and mobile number are required.' }, { status: 400 });
    }
    if (!body.eighteen_confirmed) {
      return Response.json({ error: 'Guests must confirm they are 18 or older.' }, { status: 400 });
    }

    const event = await base44.asServiceRole.entities.Event.get(eventId);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const mine = await base44.asServiceRole.entities.Attendee.filter(
      { event_id: eventId, user_id: user.id },
      { limit: 5 }
    );
    const existing = (mine.items || []).find((a) => a.status !== 'cancelled');
    if (existing) {
      return Response.json({
        attendee: existing,
        waitlist: existing.status === 'waitlist',
        message: existing.status === 'waitlist' ? event.waitlist_message : null,
      });
    }

    const capacity = Number(event.capacity ?? 40);
    const taken = await base44.asServiceRole.entities.Attendee.count({ event_id: eventId, status: 'active' });
    const full = taken >= capacity;

    const attendee = await base44.asServiceRole.entities.Attendee.create({
      event_id: eventId,
      user_id: user.id,
      full_name: fullName,
      email,
      mobile,
      eighteen_confirmed: true,
      text_opt_in: Boolean(body.text_opt_in),
      text_opt_in_at: body.text_opt_in ? new Date().toISOString() : '',
      status: full ? 'waitlist' : 'active',
      gift_status: 'none',
      gift_amount: 0,
    });

    return Response.json({
      attendee,
      waitlist: full,
      message: full ? event.waitlist_message : null,
      seats_left: Math.max(capacity - taken - (full ? 0 : 1), 0),
    });
  } catch (error) {
    console.error('claimGuestPass failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}