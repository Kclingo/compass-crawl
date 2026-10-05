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
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Compass className="h-6 w-6 text-secondary" />
          <Link to="/" className="font-heading text-xl uppercase tracking-[0.3em]">
            Compass Crawl
          </Link>
        </div>
      </header>

      <ShowcaseAlert />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card">
        <div className="mx-auto flex max-w-2xl">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]',
                  isActive ? 'text-accent' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}