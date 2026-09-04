/**
 * Google Analytics 4, and the consent state that gates it.
 *
 * The site is run from the Netherlands, so GA's cookies are not "strictly
 * necessary" under ePrivacy and may not be set before the visitor agrees.
 * That drives the whole design here: nothing from Google is requested until
 * consent is explicitly granted, and the decision is stored per browser so the
 * banner is asked once.
 */

/**
 * Empty when unset, which is the normal state locally and on previews — the
 * component reading it renders nothing, so dev traffic never reaches GA and
 * `npm run dev` stays free of third-party requests. Must be referenced as a
 * full literal for Next to inline it at build time.
 */
export const GA_MEASUREMENT_ID: string =
  process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";

/** Namespaced like every other key we put in this origin's localStorage. */
export const CONSENT_STORAGE_KEY = "2hg:consent:v1";

export type ConsentDecision = "granted" | "denied";

/**
 * `unknown` only exists during the server render and the hydration pass, when
 * localStorage hasn't been read yet. `pending` means it *was* read and there is
 * no stored answer — that, and only that, shows the banner. Keeping the two
 * apart is what stops the banner flashing at people who already answered.
 */
export type ConsentState = "unknown" | "pending" | ConsentDecision;

declare global {
  interface Window {
    dataLayer?: unknown[];
    /**
     * Defined by CONSENT_BOOTSTRAP below, before any Google code loads, and
     * redefined identically by gtag.js later. Both push onto `dataLayer`, so
     * commands queued before the tag arrives are replayed in order when it does.
     */
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Runs `beforeInteractive`, so before hydration and before gtag.js exists.
 *
 * Two jobs. It declares Consent Mode v2 defaults as denied, which is what makes
 * a later `update` meaningful rather than a retrofit; and it replays a stored
 * "granted" synchronously, so a returning visitor's consent is already on the
 * queue by the time the tag loads. Without that replay the tag could configure
 * itself in the denied state and drop the first pageview of every visit.
 *
 * Ad storage stays denied unconditionally: we run no advertising and ask for no
 * consent to any, so there is nothing to flip it with.
 */
export const CONSENT_BOOTSTRAP = `
window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
try{if(localStorage.getItem('${CONSENT_STORAGE_KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted'})}}catch(e){}
`.trim();
