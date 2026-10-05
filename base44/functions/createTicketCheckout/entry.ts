import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const APP_URL = 'https://compass-crawl-connect.base44.app';
const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const ticketId = body && body.ticket_id;
    if (!ticketId) return Response.json({ error: 'ticket_id is required' }, { status: 400 });

    const ticket = await base44.asServiceRole.entities.Ticket.get(ticketId);
    if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.payment_status === 'paid') {
      return Response.json({ error: 'This ticket is already paid' }, { status: 400 });
    }

    const event = await base44.asServiceRole.entities.Event.get(ticket.event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const priceForTier = {
      early_bird: event.early_bird_price,
      general: event.general_price,
      ceiling: event.ceiling_price,
      comp: 0,
    };
    let amount = Number(priceForTier[ticket.price_tier] ?? event.general_price ?? 20);

    const promo = (event.promo_codes || []).find(
      (p) => p && p.code && ticket.promo_code && String(p.code).toLowerCase() === String(ticket.promo_code).toLowerCase()
    );
    if (promo) amount -= Math.round((amount * Number(promo.percent_off || 0)) / 100);
    if (event.pass_fees_to_buyer) amount += Number(event.fee_amount || 0);

    const unitAmount = Math.max(Math.round(amount * 100), 50);

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', APP_URL + '/charity?session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', APP_URL + '/tickets/new');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(unitAmount));
    params.set('line_items[0][price_data][product_data][name]', (event.title || 'Compass Crawl') + ' ticket');
    params.set(
      'line_items[0][price_data][product_data][description]',
      'Includes a $' + String(event.donation_amount || 5) + ' donation to the nonprofit you pick'
    );
    params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
    params.set('metadata[ticket_id]', ticket.id);
    params.set('metadata[event_id]', event.id);
    if (ticket.email) params.set('customer_email', ticket.email);

    const response = await fetch(STRIPE_API + '/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + secrets.get('STRIPE_SECRET_KEY'),
        'Stripe-Version': STRIPE_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params,
    });
    const session = await response.json();

    if (!response.ok) {
      console.error('createTicketCheckout stripe error', session);
      return Response.json(
        { error: (session.error && session.error.message) || 'Checkout could not be created' },
        { status: 400 }
      );
    }

    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      amount_paid: unitAmount / 100,
      payment_ref: session.id,
    });

    return Response.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('createTicketCheckout failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}