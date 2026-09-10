
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { sendSignInLink, signInWithPassword } from '../src/services/auth';
import type { EditorSession } from '../src/hooks/useEditorSession';

interface SignInPanelProps {
  session: EditorSession;
  title?: string;
  intro?: string;
  onCancel?: () => void;
}

/**
 * The one place the site asks somebody to sign in. Accounts are created by an
 * administrator - this form only lets existing ones in.
 */
export const SignInPanel: React.FC<SignInPanelProps> = ({
  session,
  title = 'Sign in to edit',
  intro = 'Content changes are limited to the agency team. Sign in with your work account to continue.',
  onCancel,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useLink, setUseLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    if (!useLink && !password) {
      setFormError('Enter your password.');
      return;
    }

    setBusy(true);
    try {
      if (useLink) {
        await sendSignInLink(email);
        setInfo('If that account exists, a sign-in link is on its way to your inbox.');
      } else {
        await signInWithPassword(email, password);
        // The session listener takes it from here.
      }
      setPassword('');
    } catch (err: any) {
      setFormError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-12 border border-white/10 bg-zinc-950 flex flex-col gap-8 shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );

  if (session.status === 'unavailable') {
    return shell(
      <>
        <div className="flex flex-col gap-4">
          <div className="w-8 h-1 bg-white"></div>
          <h2 className="text-xs font-bold uppercase tracking-[0.8em] text-white">Editing unavailable</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
            {session.notice || 'Editing is not available in this build.'}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="self-start text-[9px] text-white/20 hover:text-white uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        )}
      </>
    );
  }

  // Signed in with the wrong account, or the access check did not come back.
  if (session.status === 'signed-in') {
    return shell(
      <>
        <div className="flex flex-col gap-4">
          <div className="w-8 h-1 bg-white"></div>
          <h2 className="text-xs font-bold uppercase tracking-[0.8em] text-white">No editing access</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
            {session.notice}
          </p>
          {session.email && (
            <p className="text-[9px] text-white/20 uppercase tracking-widest">
              Signed in as {session.email}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center">
          {onCancel ? (
            <button
              onClick={onCancel}
              className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              Close
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-4">
            <button
              onClick={session.refresh}
              className="border border-white/20 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Try again
            </button>
            <button
              onClick={() => void session.signOut()}
              className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/80 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </>
    );
  }

  return shell(
    <>
      <div className="flex flex-col gap-4">
        <div className="w-8 h-1 bg-white"></div>
        <h2 className="text-xs font-bold uppercase tracking-[0.8em] text-white">{title}</h2>
        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">{intro}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-2">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white text-[10px] tracking-[0.3em] focus:border-white outline-none transition-all placeholder:text-white/10"
            autoFocus
          />
          {!useLink && (
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-white/5 border border-white/10 px-4 py-4 text-white text-[10px] tracking-[0.3em] focus:border-white outline-none transition-all placeholder:text-white/10"
            />
          )}
          {formError && (
            <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest">{formError}</p>
          )}
          {info && (
            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{info}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setUseLink((v) => !v);
            setFormError(null);
            setInfo(null);
          }}
          className="self-start text-[9px] text-white/30 hover:text-white uppercase tracking-widest transition-colors"
        >
          {useLink ? 'Use a password instead' : 'Email me a sign-in link instead'}
        </button>

        <div className="flex justify-between items-center">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-[9px] text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={busy}
            className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/80 transition-all disabled:opacity-40"
          >
            {busy ? 'Working...' : useLink ? 'Send link' : 'Sign in'}
          </button>
        </div>
      </form>
    </>
  );
};
