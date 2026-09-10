import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Editing rights live on the server, never in the browser.
 *
 * A local flag (sessionStorage, a PIN, a query parameter) proves nothing: the
 * only answer we accept is the one the database gives us for the currently
 * signed-in user. Everything here fails closed - if we cannot get a clear
 * "yes", the caller must treat it as "no".
 */
const CAN_EDIT_RPC = 'sd_can_edit_assets';

/** No session at all - the visitor has to sign in first. */
export class NotSignedInError extends Error {
  constructor(message = 'Please sign in to make changes.') {
    super(message);
    this.name = 'NotSignedInError';
  }
}

/** Signed in, but the account is not allowed to change content. */
export class NotAnEditorError extends Error {
  constructor(message = 'This account does not have permission to edit content.') {
    super(message);
    this.name = 'NotAnEditorError';
  }
}

/** We could not reach the service that decides, so we refuse the write. */
export class AccessCheckFailedError extends Error {
  constructor(message = 'Could not verify your access right now. Please try again.') {
    super(message);
    this.name = 'AccessCheckFailedError';
  }
}

// The answer is per access token, so a refreshed or swapped session always
// re-asks. The short TTL keeps a long editing session from hammering the RPC
// while still picking up a revoked role within a minute.
const ANSWER_TTL_MS = 60_000;
let cachedAnswer: { token: string; canEdit: boolean; checkedAt: number } | null = null;

export function clearAccessCache(): void {
  cachedAnswer = null;
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

/**
 * Ask the database whether the signed-in user may edit assets.
 * Throws when the check itself fails - never silently returns `true`.
 */
export async function canEditAssets(session: Session | null): Promise<boolean> {
  if (!supabase || !session) return false;

  const now = Date.now();
  if (
    cachedAnswer &&
    cachedAnswer.token === session.access_token &&
    now - cachedAnswer.checkedAt < ANSWER_TTL_MS
  ) {
    return cachedAnswer.canEdit;
  }

  const { data, error } = await supabase.rpc(CAN_EDIT_RPC);
  if (error) {
    cachedAnswer = null;
    throw new AccessCheckFailedError();
  }

  const canEdit = data === true;
  cachedAnswer = { token: session.access_token, canEdit, checkedAt: now };
  return canEdit;
}

/**
 * Gate for every write path. Returns the live session (its access token is
 * what the upload Worker will re-verify) or throws with a message that is
 * safe to show to a person.
 */
export async function requireEditorSession(): Promise<Session> {
  if (!supabase) {
    throw new AccessCheckFailedError('Editing is not available in this build.');
  }
  const session = await getSession();
  if (!session) throw new NotSignedInError();
  if (!(await canEditAssets(session))) throw new NotAnEditorError();
  return session;
}

/** Turn Supabase's wording into something a person can act on. */
function friendlyMessage(raw: string): string {
  const message = raw.toLowerCase();
  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('signups not allowed') || message.includes('user not found')) {
    return 'There is no account for this email address.';
  }
  if (message.includes('email not confirmed')) {
    return 'This account still needs to confirm its email address.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return 'Sign-in failed. Please check the details and try again.';
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) throw new AccessCheckFailedError('Editing is not available in this build.');
  clearAccessCache();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(friendlyMessage(error.message));
}

/**
 * Magic link for accounts that already exist. `shouldCreateUser: false` keeps
 * this from doubling as an open sign-up form.
 */
export async function sendSignInLink(email: string): Promise<void> {
  if (!supabase) throw new AccessCheckFailedError('Editing is not available in this build.');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw new Error(friendlyMessage(error.message));
}

export async function signOut(): Promise<void> {
  clearAccessCache();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onAuthChange(
  handler: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(handler);
  return () => data.subscription.unsubscribe();
}

export { isSupabaseConfigured };
