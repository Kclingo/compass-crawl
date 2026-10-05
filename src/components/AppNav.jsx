import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Compass, SlidersHorizontal, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile bottom bar keeps the three hubs of the journey.
export const PRIMARY_ITEMS = [
  { to: '/', label: 'Passport', icon: Compass, end: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/providers', label: 'Providers', icon: Users },
];

export const BACK_OFFICE_ITEM = { to: '/admin', label: 'Back office', icon: SlidersHorizontal };

// Wider screens get every screen in the header, so nothing has to be hunted for.
const DESKTOP_ITEMS = [
  { to: '/', label: 'Passport', end: true },
  { to: '/tickets/new', label: 'My ticket' },
  { to: '/charity', label: 'Charity' },
  { to: '/check-in', label: 'Check-in' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/providers', label: 'Providers' },
  { to: '/feedback', label: 'Feedback' },
];

export default function AppNav({ isAdmin }) {
  const items = isAdmin
    ? [...DESKTOP_ITEMS, { to: BACK_OFFICE_ITEM.to, label: BACK_OFFICE_ITEM.label }]
    : DESKTOP_ITEMS;

  return (
    <nav aria-label="Main" className="hidden border-t border-border lg:block">
      <div className="flex flex-wrap items-center gap-6 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative pb-1 text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:bottom-0 after:inset-x-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:content-[''] after:transition-transform after:[transition-duration:220ms] focus-visible:text-foreground focus-visible:after:scale-x-100 active:text-accent-strong",
                isActive
                  ? 'text-foreground after:scale-x-100'
                  : 'text-muted-foreground hover:text-foreground hover:after:scale-x-100'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}