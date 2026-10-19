import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { stripePost, stripeErrorMessage } from '../../shared/stripe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to give' }, { status: 401 });

    const appUrl = req.headers.get('X-Base44-App-Url');
    if (!appUrl) {
      console.error('createGiftCheckout missing X-Base44-App-Url header');
      return Response.json({ error: 'Checkout is unavailable right now' }, { status: 500 });
    }

    const body = await req.json();
    const attendeeId = body && body.attendee_id;
    if (!attendeeId) return Response.json({ error: 'attendee_id is required' }, { status: 400 });

    // A user-scoped read: row-level security only returns a pass this guest owns.
    const mine = await base44.entities.Attendee.filter({ id: attendeeId }, { limit: 1 });
    const attendee = (mine.items || [])[0];
    if (!attendee) return Response.json({ error: 'Pass not found' }, { status: 404 });
    if (attendee.status !== 'active') {
      return Response.json({ error: 'A waitlist guest can give once a seat opens.' }, { status: 400 });
    }
    if (attendee.gift_status === 'paid') {
      return Response.json({ error: 'Your gift is already in' }, { status: 400 });
    }

    const event = await base44.asServiceRole.entities.Event.get(attendee.event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const requested = Number(body.amount ?? event.gift_suggested_amount ?? 5);
    const amount = Math.min(Math.max(Math.round(requested), 1), 500);

    const pickPage = await base44.asServiceRole.entities.CharityPick.filter(
      { attendee_id: attendee.id },
      { limit: 1 }
    );
    const pick = (pickPage.items || [])[0] || null;
    let causeName = '';
    if (pick) {
      const charity = await base44.asServiceRole.entities.Charity.get(pick.charity_id);
      causeName = charity ? charity.name : '';
    }

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', appUrl + '/pass?session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', appUrl + '/gift');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(amount * 100));
    params.set('line_items[0][price_data][product_data][name]', 'Compass Crawl gift');
    params.set(
      'line_items[0][price_data][product_data][description]',
      causeName
        ? 'A gift through Therapy Hour & Co. to ' + causeName
        : 'A gift through Therapy Hour & Co. to the cause you picked'
    );
    params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
    params.set('metadata[attendee_id]', attendee.id);
    params.set('metadata[event_id]', event.id);
    if (pick) params.set('metadata[charity_id]', pick.charity_id);
    if (attendee.email) {
      params.set('customer_email', attendee.email);
      params.set('payment_intent_data[receipt_email]', attendee.email);
    }

    const result = await stripePost('/checkout/sessions', params);
    if (!result.ok) {
      console.error('createGiftCheckout stripe error', result.data);
      return Response.json(
        { error: stripeErrorMessage(result.data, 'Checkout could not be created') },
        { status: 400 }
      );
    }

    await base44.asServiceRole.entities.Attendee.update(attendee.id, { gift_ref: result.data.id });

    return Response.json({ url: result.data.url, id: result.data.id, amount });
  } catch (error) {
    console.error('createGiftCheckout failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}