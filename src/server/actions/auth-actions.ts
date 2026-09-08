"use server";

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { authRateLimiter } from "@/lib/rate-limit";
import { emailProvider } from "@/integrations/email";
import { AppError, toSafeError } from "@/lib/errors";
import { registerSchema, type RegisterInput } from "@/validation/auth";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  try {
    const allowed = await authRateLimiter.check(`register:${input.email}`);
    if (!allowed) {
      throw new AppError("Too many attempts. Please try again in a minute.", "RATE_LIMITED");
    }

    const parsed = registerSchema.parse(input);

    const existing = await db.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      throw new AppError("An account with this email already exists. Try signing in instead.", "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(parsed.password);

    const user = await db.user.create({
      data: { email: parsed.email, name: parsed.name, passwordHash },
    });

    await sendVerificationEmail(user.email);

    return { success: true, message: "Check your email to verify your account." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't create your account. Please try again.");
    return { success: false, message: safeError.userMessage };
  }
}

async function sendVerificationEmail(email: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await db.verificationToken.create({ data: { identifier: email, token, expires } });

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await emailProvider.send({
    to: email,
    subject: "Verify your Sultan Nut House account",
    html: `<p>Welcome to Sultan Nut House. <a href="${verifyUrl}">Click here to verify your email</a>. This link expires in 24 hours.</p>`,
    text: `Welcome to Sultan Nut House. Verify your email: ${verifyUrl} (expires in 24 hours)`,
  });
}

export async function verifyEmail(token: string, email: string): Promise<ActionResult> {
  try {
    const record = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!record || record.expires < new Date()) {
      throw new AppError("This verification link is invalid or has expired.", "TOKEN_INVALID");
    }

    const user = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });

      await tx.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

      // Safe because we just proved ownership of this email address: link
      // any guest orders placed under the same email to this account.
      await tx.order.updateMany({
        where: { contactEmail: email, userId: null },
        data: { userId: updatedUser.id },
      });

      return updatedUser;
    });

    return { success: true, message: `Email verified — welcome, ${user.name ?? "friend"}!` };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't verify your email. Please request a new link.");
    return { success: false, message: safeError.userMessage };
  }
}
