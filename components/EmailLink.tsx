import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EMAIL = 'new@superdudes.agency';

// A bare mailto: link silently does nothing when the visitor has no mail app
// configured (common for people who use Gmail in the browser). We keep the
// mailto: for those who do, and on every click also copy the address and show
// a short confirmation, so the click always has a visible result.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children: React.ReactNode;
};

export const EmailLink: React.FC<Props> = ({ children, onClick, ...rest }) => {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Do not preventDefault: the mailto: still opens a mail app where one exists.
    const ok = await copyText(EMAIL);
    setToast(ok ? `${EMAIL} — copied` : EMAIL);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <>
      <a href={`mailto:${EMAIL}`} onClick={handleClick} {...rest}>
        {children}
      </a>
      {toast &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-black text-white border border-white/20 text-[10px] font-medium uppercase tracking-[0.3em] whitespace-nowrap pointer-events-none"
          >
            {toast}
          </div>,
          document.body,
        )}
    </>
  );
};
