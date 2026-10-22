import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Heart, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import useCurrentEvent from '@/hooks/useCurrentEvent';
import useMyPass from '@/hooks/useMyPass';
import useEventProviders from '@/hooks/useEventProviders';
import EventHero from '@/components/tonight/EventHero';
import NowNext from '@/components/tonight/NowNext';
import PassCard from '@/components/tonight/PassCard';
import CauseCard from '@/components/tonight/CauseCard';
import StopsList from '@/components/tonight/StopsList';
import { buildRunOfShow, isFeedbackOpen } from '@/lib/compass';

export default function Home() {
  const { event, loading: eventLoading } = useCurrentEvent();
  const { attendee, pick, loading: passLoading, reload } = useMyPass(event?.id);
  const { eventProviders, providersById } = useEventProviders(event?.id);
  const [charity, setCharity] = React.useState(null);

  React.useEffect(() => {
    if (!pick?.charity_id) {
      setCharity(null);
      return;
    }
    base44.entities.Charity.get(pick.charity_id).then(setCharity);
  }, [pick?.charity_id]);

  if (eventLoading || passLoading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }

  if (!event) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Compass className="mx-auto h-8 w-8 text-accent-strong" />
        <p className="mt-3 font-heading text-xl">The next Crawl is being planned</p>
        <p className="mt-1 text-sm text-muted-foreground">Watch your email for the next date.</p>
      </div>
    );
  }

  const rows = buildRunOfShow(event, eventProviders, providersById);
  const feedbackOpen = isFeedbackOpen(event);

  return (
    <div className="space-y-5">
      <EventHero event={event} />
      {attendee ? (
        <>
          <NowNext event={event} rows={rows} providersById={providersById} />
          <PassCard event={event} attendee={attendee} />
          <CauseCard event={event} pick={pick} charity={charity} />
          <StopsList
            event={event}
            eventProviders={eventProviders}
            providersById={providersById}
            attendee={attendee}
          />
          {attendee.checked_in_at && feedbackOpen && (
            <section className="rounded-lg border border-border bg-card p-5">
              <p className="font-heading text-xl">How was tonight?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Four questions, fully anonymous, helps the next Crawl.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4 w-full">
                <Link to="/feedback">Share feedback</Link>
              </Button>
            </section>
          )}
          {attendee.gift_status !== 'paid' && attendee.status === 'active' && (
            <section className="rounded-lg border border-border bg-card p-5">
              <p className="flex items-center gap-2 font-heading text-xl">
                <Heart className="h-5 w-5 text-accent-strong" /> Gift something back
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                A gift goes through Therapy Hour &amp; Co. to the cause you picked. Never required.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-4 w-full">
                <Link to="/gift">Give what feels right</Link>
              </Button>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-lg border border-border bg-card p-5">
          <p className="font-heading text-xl">Your pass is free</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your name, email and mobile, then pick one of this month&rsquo;s causes. {event.capacity || 40} seats.
          </p>
          <Button asChild size="lg" className="mt-4 w-full">
            <Link to="/pass/new">Claim my free pass</Link>
          </Button>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> We email your confirmation. Texts only if you opt in.
          </p>
        </section>
      )}
    </div>
  );
}