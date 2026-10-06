import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ATTENDEE, clearPendingAccountType, pendingAccountType } from '@/lib/accountType';

// Resolves the signed-in account's type, applying the choice made at sign-up.
export default function useAccountType() {
  const [accountType, setAccountType] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await base44.auth.me();
      const current = user?.account_type ?? ATTENDEE;
      const pending = pendingAccountType();

      if (pending && pending !== current) {
        const updated = await base44.auth.updateMe({ account_type: pending });
        clearPendingAccountType();
        if (active) setAccountType(updated?.account_type ?? pending);
        return;
      }

      if (active) setAccountType(current);
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return accountType;
}