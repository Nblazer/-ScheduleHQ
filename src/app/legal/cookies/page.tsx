export const metadata = { title: "Cookie policy" };

const EFFECTIVE = "April 30, 2026";
const CONTACT_EMAIL = "pluckergamer@gmail.com";

export default function CookiesPage() {
  return (
    <>
      <h1>Cookie policy</h1>
      <p className="effective">Effective: {EFFECTIVE}</p>

      <p>
        ScheduleHQ uses cookies only where they&apos;re necessary to make the service
        work. We don&apos;t run third-party advertising trackers, fingerprinting, or
        cross-site analytics. Here&apos;s the complete list.
      </p>

      <h2>Strictly necessary cookies</h2>
      <p>These can&apos;t be turned off — without them you can&apos;t log in or use the app.</p>
      <ul>
        <li>
          <strong><code>shq_session</code></strong> — your login session token. HTTP-only, SameSite=Lax, Secure in production. Expires 30 days after issue or on logout.
        </li>
        <li>
          <strong><code>shq_cookie_consent</code></strong> — records that you&apos;ve seen and acknowledged this notice so we don&apos;t show the banner again. Expires after 1 year.
        </li>
      </ul>

      <h2>Functional cookies</h2>
      <p>These remember your preferences. Removing them just resets the preferences to defaults.</p>
      <ul>
        <li>
          <strong><code>shq_theme</code></strong> — which color theme you picked (midnight / daylight / slate / mocha). Expires after 1 year.
        </li>
        <li>
          <strong><code>shq_accent</code></strong> — which accent color you picked. Expires after 1 year.
        </li>
      </ul>

      <h2>Analytics, advertising, and tracking</h2>
      <p>
        <strong>None.</strong> We don&apos;t set any of these cookies and we don&apos;t
        embed third-party scripts that would set them on our behalf.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can delete or block cookies via your browser&apos;s settings. Blocking{" "}
        <code>shq_session</code> will log you out and prevent you from logging back in.
        Blocking the others will reset your preferences to defaults but otherwise
        leaves the service working.
      </p>

      <h2>Third-party cookies via processors</h2>
      <p>
        Our hosting provider (Vercel) may set strictly-necessary cookies for things like
        load balancing or DDoS protection. Their cookies do not identify you to us.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
