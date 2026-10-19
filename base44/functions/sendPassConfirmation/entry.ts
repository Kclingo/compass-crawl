import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const attendeeId = body && body.attendee_id;
    if (!attendeeId) return Response.json({ error: 'attendee_id is required' }, { status: 400 });

    // User-scoped read: the pass only comes back if this guest owns it.
    const mine = await base44.entities.Attendee.filter({ id: attendeeId }, { limit: 1 });
    const attendee = (mine.items || [])[0];
    if (!attendee) return Response.json({ error: 'Pass not found' }, { status: 404 });
    if (attendee.status !== 'active') return Response.json({ skipped: 'waitlist' });

    const event = await base44.asServiceRole.entities.Event.get(attendee.event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const pickPage = await base44.asServiceRole.entities.CharityPick.filter(
      { attendee_id: attendee.id },
      { limit: 1 }
    );
    const pick = (pickPage.items || [])[0];
    let causeName = 'Your cause is not picked yet';
    if (pick) {
      const charity = await base44.asServiceRole.entities.Charity.get(pick.charity_id);
      if (charity) causeName = charity.name;
    }

    const eventTime = [event.start_time, event.end_time ? 'to ' + event.end_time : '']
      .filter(Boolean)
      .join(' ');

    const headerUrl = req.headers.get('x-base44-app-url');
    const appUrl = (headerUrl || 'https://compass-crawl-connect.base44.app').replace(/\/+$/, '');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: attendee.email,
      template_name: 'PassConfirmation',
      variables: {
        first_name: (attendee.full_name || '').split(' ')[0] || 'there',
        event_title: event.title || 'The Compass Crawl',
        event_date: event.date || '',
        event_time: eventTime,
        venue: event.venue || '',
        cause_name: causeName,
        pass_url: appUrl + '/pass',
      },
    });

    return Response.json({ sent: true });
  } catch (error) {
    console.error('sendPassConfirmation failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}