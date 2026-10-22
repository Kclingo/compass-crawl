import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { recordPaidGift } from '../../shared/gifts.ts';

async function signatureMatches(raw, header, secret) {
  const parts = {};
  String(header || '')
    .split(',')
    .forEach((pair) => {
      const index = pair.indexOf('=');
      if (index > 0) parts[pair.slice(0, index)] = pair.slice(index + 1);
    });
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + raw));
  const hex = Array.from(new Uint8Array(mac))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  if (hex.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < hex.length; i += 1) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      console.error('stripeGiftWebhook missing STRIPE_WEBHOOK_SECRET');
      return Response.json({ error: 'Webhook is not configured' }, { status: 500 });
    }

    const raw = await req.text();
    const valid = await signatureMatches(raw, req.headers.get('stripe-signature'), secret);
    if (!valid) {
      console.error('stripeGiftWebhook signature rejected');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(raw || '{}');
    const type = event.type || '';
    if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
      return Response.json({ received: true, ignored: type });
    }

    const session = (event.data && event.data.object) || {};
    const meta = session.metadata || {};
    if (meta.base44_test_checkout === 'true') {
      return Response.json({ received: true, test_checkout: true });
    }
    if (session.payment_status !== 'paid') {
      return Response.json({ received: true, unpaid: true });
    }
    if (!meta.attendee_id) {
      return Response.json({ received: true, no_pass: true });
    }

    const recorded = await recordPaidGift(base44, {
      attendeeId: meta.attendee_id,
      amountCents: session.amount_total,
      sessionId: session.id,
    });
    if (!recorded) {
      console.error('stripeGiftWebhook pass not found', meta.attendee_id);
      return Response.json({ received: true, pass_found: false });
    }

    console.log('stripeGiftWebhook recorded gift', recorded.attendee_id, recorded.amount);
    return Response.json({ received: true, ...recorded });
  } catch (error) {
    console.error('stripeGiftWebhook failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}