// Which kind of account someone signed up for. The choice is made on the
// registration screen and applied to the account as soon as they are signed in
// (email sign-ups land here after verifying their code, Google sign-ups after
// coming back from Google).
const STORAGE_KEY = 'cc_account_type';

export const ATTENDEE = 'attendee';
export const PROVIDER = 'provider';

export function rememberAccountType(accountType) {
  localStorage.setItem(STORAGE_KEY, accountType);
}

export function pendingAccountType() {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearPendingAccountType() {
  localStorage.removeItem(STORAGE_KEY);
}