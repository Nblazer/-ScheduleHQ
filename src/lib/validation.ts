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

export const shiftSchema = z
  .object({
    employeeId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    position: z.string().trim().max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "Shift end must be after start.", path: ["endsAt"] });

export const dayNoteSchema = z.object({
  date: z.coerce.date(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(1000).optional().nullable(),
  color: z.enum(["blue", "amber", "emerald", "rose", "violet"]).default("blue"),
});

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
