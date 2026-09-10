import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  canEditAssets,
  clearAccessCache,
  getSession,
  isSupabaseConfigured,
  onAuthChange,
  signOut as signOutUser,
} from '../services/auth';

export type EditorStatus =
  /** still working out who is here */
  | 'loading'
  /** nobody is signed in */
  | 'anonymous'
  /** signed in, but not allowed to edit (or we could not confirm) */
  | 'signed-in'
  /** signed in and confirmed as an editor */
  | 'editor'
  /** this build has no backend configured */
  | 'unavailable';

export interface EditorSession {
  status: EditorStatus;
  canEdit: boolean;
  email: string | null;
  /** Human-readable reason why editing is not available, if any. */
  notice: string | null;
  signOut: () => Promise<void>;
  refresh: () => void;
}

/**
 * Single source of truth for "may this browser change content?".
 * It follows the auth session and re-asks the server on every change.
 */
export function useEditorSession(): EditorSession {
  const [status, setStatus] = useState<EditorStatus>(
    isSupabaseConfigured ? 'loading' : 'unavailable'
  );
  const [email, setEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    clearAccessCache();
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    let evaluation = 0;

    if (!isSupabaseConfigured) {
      setStatus('unavailable');
      setNotice('Editing is not available in this build.');
      return () => {
        alive = false;
      };
    }

    const evaluate = async (session: Session | null) => {
      if (!alive) return;
      const ticket = ++evaluation;
      if (!session) {
        if (!alive || ticket !== evaluation) return;
        setStatus('anonymous');
        setEmail(null);
        setNotice(null);
        return;
      }

      setStatus('loading');
      const who = session.user?.email ?? null;
      try {
        const allowed = await canEditAssets(session);
        if (!alive || ticket !== evaluation) return;
        setEmail(who);
        setStatus(allowed ? 'editor' : 'signed-in');
        setNotice(
          allowed ? null : 'This account does not have permission to edit content.'
        );
      } catch {
        if (!alive || ticket !== evaluation) return;
        setEmail(who);
        setStatus('signed-in');
        setNotice('Could not verify your access right now. Please try again.');
      }
    };

    getSession().then((session) => { if (alive && evaluation === 0) void evaluate(session); });

    // The auth callback runs inside the client's own lock, so any further
    // Supabase call has to be deferred out of it.
    const unsubscribe = onAuthChange((_event, session) => {
      clearAccessCache();
      setTimeout(() => {
        void evaluate(session);
      }, 0);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [nonce]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setStatus(isSupabaseConfigured ? 'anonymous' : 'unavailable');
    setEmail(null);
    setNotice(null);
  }, []);

  return {
    status,
    canEdit: status === 'editor',
    email,
    notice,
    signOut,
    refresh,
  };
}
