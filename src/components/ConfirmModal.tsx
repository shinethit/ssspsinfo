import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PendingRequest {
  message: string;
  resolve: (value: boolean) => void;
}

// Module-level handler registered by <ConfirmModalHost /> when it mounts.
let requestHandler: ((message: string) => Promise<boolean>) | null = null;

/**
 * Show an in-app confirmation dialog and wait for the user's answer.
 * Usage: `if (!(await confirmDialog('ဖျက်ရန် သေချာပါသလား?'))) return;`
 * Returns false if the modal is not mounted yet, or if another confirm
 * is already open.
 */
export function confirmDialog(message: string): Promise<boolean> {
  if (!requestHandler) return Promise.resolve(false);
  return requestHandler(message);
}

/**
 * Render once near the app root (in Layout, next to <Toaster />).
 * Keeps the pending request in state and resolves its promise when the
 * user confirms, cancels, clicks the backdrop, or presses Escape.
 */
export function ConfirmModalHost() {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);

  useEffect(() => {
    requestHandler = (message: string) => {
      if (pendingRef.current) return Promise.resolve(false);
      return new Promise<boolean>((resolve) => {
        const req: PendingRequest = { message, resolve };
        pendingRef.current = req;
        setPending(req);
      });
    };
    return () => {
      requestHandler = null;
    };
  }, []);

  const close = (result: boolean) => {
    const cur = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    if (cur) cur.resolve(result);
  };

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
      aria-label="အတည်ပြုခြင်း"
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={() => close(false)}
            aria-label="ပိတ်မည်"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="font-bold text-lg text-slate-900 mt-4">သေချာပါသလား?</h3>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
          {pending.message}
        </p>
        <div className="flex gap-3 pt-5">
          <button
            type="button"
            onClick={() => close(false)}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition"
          >
            မလုပ်တော့ပါ
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            autoFocus
            className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-sm hover:bg-rose-700 transition"
          >
            လုပ်မည်
          </button>
        </div>
      </div>
    </div>
  );
}
