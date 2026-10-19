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

export function formatEventWindow(event) {
  if (!event) return '';
  const start = formatClock(event.start_time || event.welcome_time);
  const end = formatClock(event.end_time || event.last_call_time);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isEventNight(event) {
  if (!event?.date) return false;
  return event.date === todayKey();
}

export function isCheckInClosed(event, now = new Date()) {
  if (!event?.check_in_open) return true;
  const closes = combineDateTime(event.date, event.check_in_closes_at);
  return closes ? now.getTime() > closes.getTime() : false;
}

export function isFeedbackOpen(event, now = new Date()) {
  if (!event) return false;
  if (event.status === 'closed') return true;
  const opens = combineDateTime(event.date, event.feedback_opens_at);
  return opens ? now.getTime() >= opens.getTime() : false;
}

export function minutesUntil(target) {
  if (!target) return null;
  return Math.round((target.getTime() - Date.now()) / 60000);
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

export function buildRunOfShow(event, eventProviders, providersById) {
  const rows = [];
  (event?.run_of_show || []).forEach((row, index) => {
    if (!row?.time) return;
    rows.push({ key: `run-${index}`, time: row.time, label: row.label || 'Crawl moment', kind: 'note' });
  });
  (eventProviders || []).forEach((ep) => {
    if (!ep.showcase_time) return;
    rows.push({
      key: ep.id,
      time: ep.showcase_time,
      label: ep.showcase_title || `${providersById[ep.provider_id]?.name || 'Provider'} showcase`,
      kind: 'showcase',
      ep,
    });
  });
  return rows.sort((a, b) => (a.time < b.time ? -1 : 1));
}

export function nowAndNext(event, rows, now = new Date()) {
  if (!isEventNight(event)) return { now: null, next: null };
  const timed = rows.map((row) => ({ row, at: combineDateTime(event.date, row.time) })).filter((r) => r.at);
  const past = timed.filter((r) => r.at.getTime() <= now.getTime());
  const upcoming = timed.filter((r) => r.at.getTime() > now.getTime());
  return {
    now: past.length ? past[past.length - 1].row : null,
    next: upcoming.length ? upcoming[0].row : null,
    nextAt: upcoming.length ? upcoming[0].at : null,
  };
}

export function downloadIcs(event) {
  const start = combineDateTime(event?.date, event?.start_time || event?.welcome_time);
  const end = combineDateTime(event?.date, event?.end_time || event?.last_call_time);
  if (!start || !end) return;
  const stamp = (d) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Compass Crawl//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@compasscrawl`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${event.title || 'Compass Crawl'}`,
    `LOCATION:${event.venue || ''}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'compass-crawl.ics';
  link.click();
  URL.revokeObjectURL(url);
}