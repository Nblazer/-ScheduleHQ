import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email.");

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters.")
  .max(200, "Too long.");

export const nameSchema = z.string().trim().min(1, "Required.").max(80);

export const signupSchema = z.object({
  orgName: z.string().trim().min(1, "Your business name is required.").max(80),
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const inviteSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

// Recurrence rule: "weekly" on specific days of week, for N weeks.
// daysOfWeek uses 0=Sun..6=Sat. weeks is inclusive of the first week.
// Cap at 26 weeks (~6 months) so a runaway series can't explode the DB.
export const recurrenceSchema = z.object({
  frequency: z.enum(["NONE", "WEEKLY"]).default("NONE"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  weeks: z.number().int().min(1).max(26).default(1),
});

export const shiftSchema = z
  .object({
    employeeId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    position: z.string().trim().max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    recurrence: recurrenceSchema.optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "Shift end must be after start.", path: ["endsAt"] });

export const dayNoteSchema = z.object({
  date: z.coerce.date(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(1000).optional().nullable(),
  color: z.enum(["blue", "amber", "emerald", "rose", "violet"]).default("blue"),
  recurrence: recurrenceSchema.optional(),
});

// How much of a recurring series to delete when the user clicks trash.
export const deleteScopeSchema = z.enum(["single", "future", "series"]);
export type DeleteScope = z.infer<typeof deleteScopeSchema>;

export const swapRequestSchema = z.object({
  requesterShiftId: z.string().min(1),
  targetUserId: z.string().min(1),
  targetShiftId: z.string().optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const resourcePageSchema = z.object({
  title: z.string().trim().min(1, "Title required.").max(120),
  icon: z.string().trim().max(8).optional().nullable(),
  body: z.string().max(20000, "Page is too long.").default(""),
});

// Organization logo — data URL, capped at 256KB post-base64.
const MAX_LOGO_BYTES = 256 * 1024;
export const logoDataUrlSchema = z
  .string()
  .max(MAX_LOGO_BYTES * 2, "Logo is too large — please use an image under 256KB.")
  .regex(
    /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i,
    "Unsupported image format. Use PNG, JPEG, GIF, WebP, or SVG.",
  );

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  pinned: z.boolean().default(false),
});

export const reportSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export const reportResponseSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]),
  response: z.string().trim().max(4000).optional().nullable(),
});

export const themeSchema = z.object({
  preset: z.enum(["midnight", "daylight", "slate", "mocha"]),
  accent: z.enum(["indigo", "violet", "emerald", "amber", "rose", "sky"]),
  scope: z.enum(["user", "organization"]).default("user"),
});
