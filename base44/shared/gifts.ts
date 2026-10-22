// Records a paid gift against the guest's pass and the cause they picked.
// Shared by the Stripe success-page confirmation and the Stripe webhook so the
// dollar amounts are kept either way.
export async function recordPaidGift(base44, opts) {
  const attendeeId = opts.attendeeId;
  const amount = Number(opts.amountCents || 0) / 100;
  const sessionId = opts.sessionId || '';

  const attPage = await base44.asServiceRole.entities.Attendee.filter({ id: attendeeId }, { limit: 1 });
  const attendee = (attPage.items || [])[0];
  if (!attendee) return null;

  await base44.asServiceRole.entities.Attendee.update(attendee.id, {
    gift_status: 'paid',
    gift_amount: amount,
    gift_ref: sessionId,
  });

  const pickPage = await base44.asServiceRole.entities.CharityPick.filter(
    { attendee_id: attendee.id },
    { limit: 1 }
  );
  const pick = (pickPage.items || [])[0];
  if (pick) {
    await base44.asServiceRole.entities.CharityPick.update(pick.id, { amount });
  }

  return { attendee_id: attendee.id, amount, attributed: Boolean(pick) };
}