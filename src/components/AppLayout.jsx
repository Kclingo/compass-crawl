import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Compass, SlidersHorizontal, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ShowcaseAlert from '@/components/ShowcaseAlert';

const BASE_ITEMS = [
  { to: '/', label: 'Passport', icon: Compass, end: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/providers', label: 'Providers', icon: Users },
];

export default function AppLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((user) => {
        if (active) setIsAdmin(user?.role === 'admin');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const items = isAdmin
    ? [...BASE_ITEMS, { to: '/admin', label: 'Back office', icon: SlidersHorizontal }]
    : BASE_ITEMS;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-[92px] max-w-2xl items-center gap-[17px] px-5 sm:h-[112px]">
          <Compass className="h-8 w-8 shrink-0 text-foreground" />
          <Link to="/" className="font-heading text-[23px] uppercase tracking-[0.25em] text-foreground">
            Compass Crawl
          </Link>
        </div>
      </header>

      <ShowcaseAlert />

      <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-background">
        <div className="mx-auto flex h-[72px] max-w-2xl sm:h-[95px]">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-2 text-[11px] transition-colors duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-wash hover:text-foreground active:text-accent-strong'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5" />
                  <span
                    className={cn(
                      'relative',
                      isActive &&
                        "after:absolute after:-bottom-[9px] after:inset-x-0 after:h-0.5 after:bg-accent after:content-['']"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}