import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Compass, SlidersHorizontal, UserCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// The four guest tabs, in the order they appear in the bottom bar.
export const PRIMARY_ITEMS = [
  { to: '/', label: 'Tonight', icon: Compass, end: true },
  { to: '/providers', label: 'Providers', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/me', label: 'Me', icon: UserCircle },
];

export const BACK_OFFICE_ITEM = { to: '/admin', label: 'Back office', icon: SlidersHorizontal };

export const MY_PROFILE_ITEM = { to: '/provider/profile', label: 'My profile', icon: UserCircle };

const DESKTOP_ITEMS = [
  { to: '/', label: 'Tonight', end: true },
  { to: '/providers', label: 'Providers' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/pass', label: 'My pass' },
  { to: '/me', label: 'Me' },
];

export default function AppNav({ isAdmin, isProvider }) {
  const items = [
    ...DESKTOP_ITEMS,
    ...(isProvider ? [{ to: MY_PROFILE_ITEM.to, label: MY_PROFILE_ITEM.label }] : []),
    ...(isAdmin ? [{ to: BACK_OFFICE_ITEM.to, label: BACK_OFFICE_ITEM.label }] : []),
  ];

  return (
    <nav aria-label="Main" className="hidden border-t border-border/70 lg:block">
      <div className="flex flex-wrap items-center gap-6 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative pb-1 text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 after:absolute after:bottom-0 after:inset-x-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent-strong after:content-[''] after:transition-transform after:[transition-duration:220ms] focus-visible:text-foreground focus-visible:after:scale-x-100 active:text-accent-strong",
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