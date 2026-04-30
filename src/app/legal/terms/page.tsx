export const metadata = { title: "Terms of service" };

const EFFECTIVE = "April 30, 2026";
const CONTACT_EMAIL = "pluckergamer@gmail.com";

export default function TermsPage() {
  return (
    <>
      <h1>Terms of service</h1>
      <p className="effective">Effective: {EFFECTIVE}</p>

      <div className="callout">
        Plain-English summary: this is a free shift-scheduling tool. Use it for legitimate
        scheduling. Don&apos;t abuse it. We make no promises about uptime or fitness for
        purpose. If something goes catastrophically wrong, our liability is capped at what
        you paid us — which, for the free tier, is zero. Read on for the formal version.
      </div>

      <h2>1. Acceptance</h2>
      <p>
        By creating an account or using ScheduleHQ (the &quot;Service&quot;), you
        (&quot;you&quot; or &quot;User&quot;) agree to these Terms. If you don&apos;t
        agree, don&apos;t use the Service.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 16 years old (or 13 in the U.S.) to use the Service. By
        signing up you represent that you meet this minimum age and that you&apos;re
        legally allowed to enter into this agreement.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You&apos;re responsible for keeping your password confidential.</li>
        <li>You&apos;re responsible for everything that happens under your account.</li>
        <li>Notify us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect unauthorized access.</li>
      </ul>

      <h2>4. Workspaces, members, and roles</h2>
      <p>
        The Service supports multi-workspace memberships. Each workspace is created and
        managed by an Owner. Owners can promote/demote/remove members and delete the
        workspace. Removed members lose access immediately; their historical content
        (shifts they worked, content they authored) may remain visible to managers as
        part of the workspace&apos;s operating record.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for anything illegal or in violation of any law in your jurisdiction</li>
        <li>Send spam, harass, threaten, or impersonate other users</li>
        <li>Reverse engineer, scrape at scale, or attempt to disrupt the Service</li>
        <li>Use the Service to handle data that requires regulated security controls (HIPAA, PCI-DSS, etc.) — ScheduleHQ is not certified for those</li>
        <li>Resell the Service or give it a different name and offer it as your own</li>
      </ul>
      <p>
        We can suspend or terminate accounts that violate these terms, with or without
        notice if the violation is severe.
      </p>

      <h2>6. Your content</h2>
      <p>
        You keep ownership of the content you put into ScheduleHQ (schedules,
        announcements, reports, reminders, resources, logos, etc.). You grant us a
        limited license to host, transmit, display, and back up that content solely to
        operate the Service for you.
      </p>

      <h2>7. Email and notifications</h2>
      <p>
        We may send transactional email related to your account (verification, invites,
        announcements your manager triggers, swap requests, etc.). We don&apos;t send
        marketing email.
      </p>

      <h2>8. Pricing and changes</h2>
      <p>
        ScheduleHQ has Free, Basic, and Pro tiers. Until paid billing launches, the
        Service is free regardless of tier. When paid billing launches, you&apos;ll be
        notified and given the chance to choose a tier; existing data is preserved
        either way. Prices and limits may change with at least 30 days&apos; notice.
      </p>

      <h2>9. Disclaimer of warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; WE
        DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
        SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF MALICIOUS COMPONENTS.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING OUT OF OR
        RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID US IN
        THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $50. IN NO EVENT WILL WE BE
        LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES,
        INCLUDING LOST PROFITS OR LOST DATA, EVEN IF ADVISED OF THE POSSIBILITY.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from any claim arising out of your
        violation of these Terms, your content, or your misuse of the Service.
      </p>

      <h2>12. Termination</h2>
      <p>
        You can delete your account at any time in Settings. We can terminate or
        suspend your access for material violations of these Terms. After termination,
        the disclaimers and liability limits survive.
      </p>

      <h2>13. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in which
        the Service operator resides, without regard to conflict-of-law rules. Any
        dispute will be resolved in the courts of that state, except that either party
        may seek injunctive relief in any competent court.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these Terms. Material changes will be announced in-app or by
        email. Continued use after changes means you accept the updated Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
