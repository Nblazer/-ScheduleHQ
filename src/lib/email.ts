import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "ScheduleHQ <noreply@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Lazily instantiate so the build/dev works without a key.
let client: Resend | null = null;
function getClient() {
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const c = getClient();
  if (!c) {
    console.warn(
      `[email] RESEND_API_KEY not set — email to ${to} ("${subject}") was not sent.\n${stripTags(html).slice(0, 400)}`,
    );
    return { skipped: true as const };
  }
  const res = await c.emails.send({ from, to, subject, html });
  if (res.error) throw new Error(res.error.message);
  return { id: res.data?.id, skipped: false as const };
}

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function layout(inner: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1b1d28">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(15,23,42,.08);overflow:hidden">
        <tr><td style="padding:28px 32px;background:linear-gradient(120deg,#4338ca,#7c3aed);color:#fff">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.8">ScheduleHQ</div>
          <div style="font-size:22px;font-weight:600;margin-top:6px">Built for teams that run on shifts.</div>
        </td></tr>
        <tr><td style="padding:32px">${inner}</td></tr>
        <tr><td style="padding:20px 32px;background:#f7f8fc;color:#6b7280;font-size:12px;text-align:center">
          You're receiving this because an account was created on ScheduleHQ.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#4338ca;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">${label}</a>`;
}

export function verificationEmail(p: { name: string; token: string }) {
  const url = `${appUrl}/verify?token=${p.token}`;
  return layout(`
    <h1 style="font-size:20px;margin:0 0 12px">Welcome, ${escape(p.name)}.</h1>
    <p style="margin:0 0 18px;line-height:1.6">Confirm your email address to finish setting up your ScheduleHQ workspace.</p>
    <p style="margin:0 0 24px">${button(url, "Confirm email")}</p>
    <p style="margin:0;color:#6b7280;font-size:13px">Or paste this link into your browser:<br/><span style="word-break:break-all">${url}</span></p>
  `);
}

export function inviteEmail(p: { name: string; inviterName: string; orgName: string; token: string }) {
  const url = `${appUrl}/invite?token=${p.token}`;
  return layout(`
    <h1 style="font-size:20px;margin:0 0 12px">You've been invited to ${escape(p.orgName)}.</h1>
    <p style="margin:0 0 18px;line-height:1.6">${escape(p.inviterName)} added you to their team on ScheduleHQ. Set your password to accept.</p>
    <p style="margin:0 0 24px">${button(url, "Accept invitation")}</p>
    <p style="margin:0;color:#6b7280;font-size:13px">This invite expires in 7 days.<br/><span style="word-break:break-all">${url}</span></p>
  `);
}

export function shiftNotificationEmail(p: {
  name: string;
  orgName: string;
  when: string;
  position: string | null;
  notes: string | null;
}) {
  const url = `${appUrl}/schedule`;
  return layout(`
    <h1 style="font-size:20px;margin:0 0 12px">New shift scheduled</h1>
    <p style="margin:0 0 8px;line-height:1.6">Hi ${escape(p.name)}, a new shift has been added to your schedule at ${escape(p.orgName)}.</p>
    <div style="background:#f7f8fc;border-radius:10px;padding:16px;margin:16px 0">
      <div style="font-weight:600">${escape(p.when)}</div>
      ${p.position ? `<div style="color:#6b7280;margin-top:4px">${escape(p.position)}</div>` : ""}
      ${p.notes ? `<div style="color:#374151;margin-top:8px">${escape(p.notes)}</div>` : ""}
    </div>
    <p style="margin:0 0 24px">${button(url, "Open schedule")}</p>
  `);
}

export function announcementEmail(p: { name: string; orgName: string; title: string; body: string }) {
  return layout(`
    <h1 style="font-size:20px;margin:0 0 12px">${escape(p.title)}</h1>
    <p style="margin:0 0 14px;color:#6b7280;font-size:13px">From ${escape(p.orgName)}</p>
    <div style="line-height:1.6;white-space:pre-wrap">${escape(p.body)}</div>
  `);
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
