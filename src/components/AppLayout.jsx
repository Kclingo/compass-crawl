import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import ShowcaseAlert from '@/components/ShowcaseAlert';
import AppNav, { BACK_OFFICE_ITEM, MY_PROFILE_ITEM, PRIMARY_ITEMS } from '@/components/AppNav';
import useAccountType from '@/hooks/useAccountType';
import ThemeToggle from '@/components/ThemeToggle';

export default function AppLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const accountType = useAccountType();

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

  const isProvider = accountType === 'provider';
  const items = [
    ...PRIMARY_ITEMS,
    ...(isProvider ? [MY_PROFILE_ITEM] : []),
    ...(isAdmin ? [BACK_OFFICE_ITEM] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-5 lg:max-w-4xl">
          <div className="flex h-[68px] items-center gap-3 sm:h-[84px]">
            <Compass className="h-8 w-8 shrink-0 text-foreground" />
            <Link to="/" className="font-heading text-[18px] font-semibold uppercase tracking-[0.2em] text-foreground">
              Compass Crawl
            </Link>
            <ThemeToggle />
          </div>
          <AppNav isAdmin={isAdmin} isProvider={isProvider} />
        </div>
      </header>

      <ShowcaseAlert />

      <main className="mx-auto max-w-2xl px-5 py-8 sm:py-12 lg:max-w-4xl">
        <Outlet />
      </main>

      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-[68px] max-w-2xl sm:h-[84px]">
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
                        "after:absolute after:-bottom-[9px] after:inset-x-0 after:h-0.5 after:bg-accent-strong after:content-['']"
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