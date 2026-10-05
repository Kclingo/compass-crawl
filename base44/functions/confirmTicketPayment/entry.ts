import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const sessionId = body && body.session_id;
    if (!sessionId) return Response.json({ error: 'session_id is required' }, { status: 400 });

    const response = await fetch(STRIPE_API + '/checkout/sessions/' + encodeURIComponent(sessionId), {
      headers: {
        Authorization: 'Bearer ' + secrets.get('STRIPE_SECRET_KEY'),
        'Stripe-Version': STRIPE_VERSION,
      },
    });
    const session = await response.json();

    if (!response.ok) {
      console.error('confirmTicketPayment stripe error', session);
      return Response.json(
        { error: (session.error && session.error.message) || 'Could not read the payment' },
        { status: 400 }
      );
    }

    const ticketId = session.metadata && session.metadata.ticket_id;
    if (ticketId && session.payment_status === 'paid') {
      await base44.asServiceRole.entities.Ticket.update(ticketId, {
        payment_status: 'paid',
        payment_ref: session.id,
        amount_paid: (session.amount_total || 0) / 100,
      });
    }

    return Response.json({ status: session.payment_status, ticket_id: ticketId || null });
  } catch (error) {
    console.error('confirmTicketPayment failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}