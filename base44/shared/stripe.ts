import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';

function headers(extra?: Record<string, string>) {
  return {
    Authorization: 'Bearer ' + secrets.get('STRIPE_SECRET_KEY'),
    'Stripe-Version': STRIPE_VERSION,
    ...(extra || {}),
  };
}

export async function stripeGet(path: string) {
  const response = await fetch(STRIPE_API + path, {
    headers: headers(),
    signal: AbortSignal.timeout(15000),
  });
  return { ok: response.ok, data: await response.json() };
}

export async function stripePost(path: string, params: URLSearchParams) {
  const response = await fetch(STRIPE_API + path, {
    method: 'POST',
    headers: headers({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': crypto.randomUUID(),
    }),
    body: params,
    signal: AbortSignal.timeout(20000),
  });
  return { ok: response.ok, data: await response.json() };
}

export function stripeErrorMessage(data: any, fallback: string) {
  return (data && data.error && data.error.message) || fallback;
}