export function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function formatClock(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

export function formatEventDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function minutesUntil(target) {
  if (!target) return null;
  return Math.round((target.getTime() - Date.now()) / 60000);
}

export function resolveTicketTier(event, earlyBirdSold) {
  const today = new Date().toISOString().slice(0, 10);
  const withinWindow = event?.early_bird_ends ? today <= event.early_bird_ends : true;
  const underLimit = earlyBirdSold < (event?.early_bird_limit ?? 15);
  if (withinWindow && underLimit) {
    return { tier: 'early_bird', price: event?.early_bird_price ?? 15, label: 'Early bird' };
  }
  return { tier: 'general', price: event?.general_price ?? 20, label: 'General admission' };
}

export function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function money(amount) {
  return `$${Number(amount || 0).toFixed(2).replace(/\.00$/, '')}`;
}