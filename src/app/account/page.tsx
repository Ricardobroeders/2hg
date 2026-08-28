import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClaimPairing } from "@/components/ClaimPairing";
import { auth } from "@/lib/auth/server";
import { signOut } from "@/app/auth/sign-in/actions";
import { isDatabaseConfigured } from "@/lib/db";
import { listTeamsByOwner } from "@/lib/db/teams";
import { FORMATS } from "@/lib/team";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

// Session state comes from cookies, so this page can never be static.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { data: session } = await auth.getSession();

  // proxy.ts already gates this route; this is the belt to that braces, and it
  // narrows the type for everything below.
  if (!session?.user) redirect("/auth/sign-in?next=/account");

  const user = session.user;
  const pairings = isDatabaseConfigured()
    ? await listTeamsByOwner(user.id).catch(() => [])
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-8">
        {user.image ? (
          /* Google avatar URLs are arbitrary remote hosts, so next/image
             would need a config allowlist for a 56px image. Not worth it. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-14 w-14 rounded-full border border-white/10"
          />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-lg font-black text-zinc-950">
            {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-white">
            {user.name ?? "Your account"}
          </h1>
          <p className="truncate text-sm text-zinc-400">{user.email}</p>
        </div>

        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </form>
      </header>

      <ClaimPairing ownedSlugs={pairings.map((p) => p.slug)} />

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Your decks and pairings
          </h2>
          <span className="text-xs tabular-nums text-zinc-500">
            {pairings.length}
          </span>
        </div>

        {pairings.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-8 text-center">
            <p className="text-sm text-zinc-400">Nothing saved yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
              Save a pairing to share both decks with a teammate, or save a
              single deck on its own. Either way it lands here automatically
              while you&apos;re signed in.
            </p>
            <Link
              href="/team"
              className="mt-5 inline-flex rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300"
            >
              Open the team builder
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
            {pairings.map((p) => (
              <li key={p.slug}>
                <Link
                  href={p.kind === "solo" ? `/d/${p.slug}` : `/t/${p.slug}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-white">
                      <span className="truncate">{p.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          p.kind === "solo"
                            ? "bg-sky-400/15 text-sky-300"
                            : "bg-emerald-400/15 text-emerald-300"
                        }`}
                      >
                        {p.kind === "solo" ? "Deck" : "Pairing"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {FORMATS[p.format].label}
                      {" · "}
                      <span className="tabular-nums">{p.cardCount}</span> cards
                      {" · updated "}
                      <time dateTime={p.updatedAt.toISOString()}>
                        {p.updatedAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {p.viewCount} {p.viewCount === 1 ? "view" : "views"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
