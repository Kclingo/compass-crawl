import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { stripeGet, stripeErrorMessage } from '../../shared/stripe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue' }, { status: 401 });

    const body = await req.json();
    const sessionId = body && body.session_id;
    if (!sessionId) return Response.json({ error: 'session_id is required' }, { status: 400 });

    const result = await stripeGet('/checkout/sessions/' + encodeURIComponent(sessionId));
    if (!result.ok) {
      console.error('confirmGiftPayment stripe error', result.data);
      return Response.json(
        { error: stripeErrorMessage(result.data, 'Could not read the gift') },
        { status: 400 }
      );
    }

    const session = result.data;
    const attendeeId = session.metadata && session.metadata.attendee_id;
    const paid = session.payment_status === 'paid';

    if (attendeeId && paid) {
      const amount = Number(session.amount_total || 0) / 100;
      const mine = await base44.entities.Attendee.filter({ id: attendeeId }, { limit: 1 });
      const attendee = (mine.items || [])[0];
      if (!attendee) return Response.json({ error: 'Pass not found' }, { status: 404 });

      await base44.asServiceRole.entities.Attendee.update(attendeeId, {
        gift_status: 'paid',
        gift_amount: amount,
        gift_ref: session.id,
      });

      // Attribute the gift to the cause this guest picked.
      const pickPage = await base44.asServiceRole.entities.CharityPick.filter(
        { attendee_id: attendeeId },
        { limit: 1 }
      );
      const pick = (pickPage.items || [])[0];
      if (pick) {
        await base44.asServiceRole.entities.CharityPick.update(pick.id, { amount });
      }
    }

    return Response.json({ status: session.payment_status, attendee_id: attendeeId || null, paid });
  } catch (error) {
    console.error('confirmGiftPayment failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}