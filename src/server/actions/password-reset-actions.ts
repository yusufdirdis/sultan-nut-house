"use server";

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { authRateLimiter } from "@/lib/rate-limit";
import { emailProvider } from "@/integrations/email";
import { AppError, toSafeError } from "@/lib/errors";
import { requestPasswordResetSchema, resetPasswordSchema, type RequestPasswordResetInput, type ResetPasswordInput } from "@/validation/account";
import type { ActionResult } from "@/server/actions/auth-actions";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const GENERIC_SUCCESS_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<ActionResult> {
  try {
    const parsed = requestPasswordResetSchema.parse(input);

    const allowed = await authRateLimiter.check(`reset:${parsed.email}`);
    if (!allowed) {
      return { success: false, message: "Too many attempts. Please try again in a minute." };
    }

    const user = await db.user.findUnique({ where: { email: parsed.email } });

    // Never reveal whether the email exists — same message either way.
    if (user) {
      const token = randomBytes(32).toString("hex");
      await db.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}&email=${encodeURIComponent(parsed.email)}`;

      await emailProvider.send({
        to: parsed.email,
        subject: "Reset your Sultan Nut House password",
        text: `Reset your password: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore this email.`,
        html: `<p><a href="${resetUrl}">Reset your password</a>. This link expires in 1 hour.</p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    }

    return { success: true, message: GENERIC_SUCCESS_MESSAGE };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't process that request.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  try {
    const parsed = resetPasswordSchema.parse(input);

    const user = await db.user.findUnique({ where: { email: parsed.email } });
    if (!user) throw new AppError("This reset link is invalid or has expired.", "TOKEN_INVALID");

    const tokenHash = hashToken(parsed.token);
    const record = await db.passwordResetToken.findFirst({
      where: { userId: user.id, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!record) throw new AppError("This reset link is invalid or has expired.", "TOKEN_INVALID");

    const passwordHash = await hashPassword(parsed.newPassword);

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return { success: true, message: "Password reset. You can now sign in." };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't reset your password.");
    return { success: false, message: safeError.userMessage };
  }
}
