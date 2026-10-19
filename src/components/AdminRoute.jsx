import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Keeps the back office off-limits unless the signed-in account is an admin.
export default function AdminRoute() {
  const [state, setState] = useState('checking');

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((user) => {
        if (active) setState(user?.role === 'admin' ? 'admin' : 'guest');
      })
      .catch(() => {
        if (active) setState('guest');
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === 'checking') {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />;
  }
  if (state === 'guest') return <Navigate to="/" replace />;
  return <Outlet />;
}