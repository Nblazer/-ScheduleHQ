export const metadata = { title: "Privacy policy" };

const EFFECTIVE = "April 30, 2026";
const CONTACT_EMAIL = "pluckergamer@gmail.com";

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="effective">Effective: {EFFECTIVE}</p>

      <div className="callout">
        ScheduleHQ is operated as an independent project. This policy explains exactly
        what data the service collects, how it&apos;s used, who else sees it, and the
        rights you have to access or delete it. If anything here is unclear, email us
        at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </div>

      <h2>1. Who we are</h2>
      <p>
        ScheduleHQ (&quot;we&quot;, &quot;us&quot;) is a free shift-scheduling web
        application. We are the data controller for the personal information you
        provide while using the service. You can reach us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. What we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name and email address (required at signup)</li>
        <li>A bcrypt-hashed copy of your password — we never see or store the plaintext</li>
        <li>Phone number and payment-profile string (optional, only if you add them)</li>
      </ul>

      <h3>Workspace content you create or are added to</h3>
      <ul>
        <li>Workspace names, logos, schedules, shifts, day notes</li>
        <li>Announcements, reports, resource pages, swap requests</li>
        <li>Personal calendar reminders (tied only to your account)</li>
        <li>Hourly pay rate, if a manager sets it for you</li>
      </ul>

      <h3>Technical data</h3>
      <ul>
        <li>Standard server logs from our hosting provider — IP, user agent, request paths</li>
        <li>Session token (a random string in an HTTP-only cookie)</li>
        <li>Your theme and accent preferences</li>
      </ul>
      <p>
        We do not run third-party analytics, advertising trackers, fingerprinting, or
        cross-site tracking pixels.
      </p>

      <h2>3. How we use it</h2>
      <ul>
        <li>To provide the scheduling service: showing your schedule, sending invites and verification emails, computing earnings, etc.</li>
        <li>To keep your account secure (rate limits, audit logs, abuse detection)</li>
        <li>To communicate with you about your account when something material changes</li>
      </ul>
      <p>We do not sell your personal information. We do not share it for advertising.</p>

      <h2>4. Third-party processors</h2>
      <p>To operate the service, your data passes through these vendors:</p>
      <ul>
        <li>
          <strong>Vercel</strong> (United States) — application hosting and serverless
          functions. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel privacy</a>
        </li>
        <li>
          <strong>Neon</strong> (United States) — managed PostgreSQL database where your
          workspace data lives. <a href="https://neon.tech/privacy-policy" target="_blank" rel="noreferrer">Neon privacy</a>
        </li>
        <li>
          <strong>Resend</strong> or <strong>Gmail SMTP</strong> — transactional email delivery
          (verification, invites, announcements). Used only when configured by the workspace owner.
        </li>
      </ul>
      <p>
        These vendors only process data necessary to deliver their part of the service
        and are bound by their own privacy commitments.
      </p>

      <h2>5. International users</h2>
      <p>
        Our infrastructure is hosted in the United States. By using ScheduleHQ you
        consent to your information being transferred to and processed in the U.S. We
        rely on standard contractual clauses with our vendors where relevant.
      </p>

      <h2>6. Your rights</h2>
      <p>Depending on where you live (EU/UK GDPR, California CCPA, etc.) you have the right to:</p>
      <ul>
        <li><strong>Access</strong> a copy of your personal information</li>
        <li><strong>Correct</strong> inaccurate information (most fields are editable in Settings)</li>
        <li><strong>Delete</strong> your account — Settings → Danger zone → Delete account</li>
        <li><strong>Port</strong> your data to another service — email us and we&apos;ll export it</li>
        <li><strong>Opt out</strong> of any non-essential communication (we don&apos;t send marketing email today)</li>
        <li><strong>Lodge a complaint</strong> with your local data protection authority</li>
      </ul>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your request.
        We&apos;ll respond within 30 days.
      </p>

      <h2>7. Data retention</h2>
      <ul>
        <li>Your account, workspace memberships, and authored content stay until you delete them or your account.</li>
        <li>Deleted accounts are removed from the live database immediately. Backup copies expire on our database provider&apos;s schedule (typically within 30 days).</li>
        <li>Server logs are kept for up to 90 days for security and abuse investigation.</li>
        <li>If you&apos;re removed from a workspace, your historical records (e.g. shifts you worked) may remain visible to that workspace&apos;s managers — they&apos;re part of that business&apos;s operating history.</li>
      </ul>

      <h2>8. Security</h2>
      <ul>
        <li>HTTPS-only connections in production (HSTS preload via Vercel)</li>
        <li>Passwords hashed with bcrypt (cost factor 10)</li>
        <li>Session tokens stored in HTTP-only, SameSite=Lax cookies and rotated on every login</li>
        <li>Database connections require TLS</li>
      </ul>
      <p>
        No system is perfectly secure. If you discover a vulnerability, please email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> before disclosing publicly.
      </p>

      <h2>9. Children</h2>
      <p>
        ScheduleHQ is not intended for users under 16 (or under 13 in the U.S.). We do
        not knowingly collect data from children. If you believe a child has signed up,
        contact us and we&apos;ll delete the account.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We&apos;ll update the effective date above when we make changes. Material changes
        will be announced in-app or by email.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions, requests, or complaints:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
