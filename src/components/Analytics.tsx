"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { useConsent } from "@/lib/consent";

/**
 * Pageviews for App Router navigations.
 *
 * `gtag('config')` sends one pageview when the tag loads and nothing after
 * that. GA4's enhanced measurement is supposed to cover the rest via browser
 * history events, and measurably does not here — clicking through to /rules
 * produced no second hit — so every route after the first would go uncounted.
 * Firing it ourselves is the only version that doesn't depend on a setting in
 * a console we can't see from the code.
 *
 * Consequence worth knowing: if "page changes based on browser history events"
 * is ever switched on for this stream and starts working, navigations will be
 * counted twice. That checkbox stays off.
 *
 * `usePathname` alone, deliberately. `useSearchParams` would suspend and drag
 * every static page in the site into dynamic rendering, and it would log a
 * pageview per keystroke on `/cards?q=`. The query is still recorded, because
 * `page_location` carries the whole URL.
 */
function PageViews() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    // The tag's own `config` already counted the route it loaded on.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    window.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}

/**
 * GA4, mounted only once the visitor has said yes.
 *
 * Consent Mode alone would let the tag load in a denied state and send
 * cookieless pings, which is a legitimate configuration but still a request to
 * Google carrying an IP address on behalf of someone who declined. Gating the
 * mount instead means a decline — or an unanswered banner — results in no
 * contact with Google at all, which is both the stricter reading and the one
 * `/privacy` can state in a single sentence.
 */
export function Analytics() {
  const consent = useConsent();

  if (!GA_MEASUREMENT_ID || consent !== "granted") return null;

  return (
    <>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <PageViews />
    </>
  );
}
