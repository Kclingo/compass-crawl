import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function DeleteAccountCard({ onDelete }) {
  const [busy, setBusy] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <p className="font-heading text-xl">Delete my account</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Removes your pass, your cause pick, your saved providers and your reminder settings. Anonymous feedback you
        already sent stays, with no name attached.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="mt-4 w-full">
            <Trash2 className="mr-2 h-4 w-4" /> Delete my account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. You would need to claim a new pass to come to a Crawl.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setBusy(true);
                await onDelete();
              }}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Delete everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}