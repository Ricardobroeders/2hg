"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Modal } from "./Modal";

/**
 * The first-save dialog: name the thing, and mention the account.
 *
 * Two jobs, in this order of importance. First, a name — "Untitled deck" is
 * what everything ends up called otherwise, and a list of five untitled decks
 * on `/account` is useless. Second, a nudge toward signing in, because a deck
 * saved signed-out is reachable only from this browser's localStorage.
 *
 * The nudge is *never* a gate. Anonymous save-and-share is the only mechanism
 * that spreads this site, so the primary button always saves, signed in or not.
 */
export function SaveDialog({
  title,
  description,
  defaultName,
  placeholder,
  action,
  busy,
  error,
  onSave,
  onClose,
}: {
  title: string;
  description: string;
  defaultName: string;
  placeholder: string;
  /** Primary button label, e.g. "Save deck". */
  action: string;
  busy: boolean;
  error: string | null;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then((res) => {
        if (active) setSignedIn(Boolean(res?.data?.user));
      })
      // Auth being unreachable just means we don't show the nudge — it must
      // never stop someone saving.
      .catch(() => {
        if (active) setSignedIn(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const trimmed = name.trim();

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onSave(trimmed || placeholder);
        }}
      >
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            maxLength={120}
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
          />
        </label>

        {signedIn === false && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-zinc-300">
              You&apos;re not signed in.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Saving still works — you&apos;ll get a link you can send anyone.
              But only this browser will be able to edit it afterwards. Sign in
              and it lands in your account instead, editable from anywhere.
            </p>
            <Link
              href="/auth/sign-in?next=/deck-builder"
              className="mt-3 inline-block text-xs text-emerald-400 hover:text-emerald-300"
            >
              Sign in with Google first →
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-400/[0.06] px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-400 px-4 py-2.5 font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
          >
            {busy ? "Saving…" : action}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-zinc-400 transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
