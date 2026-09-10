"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/server/actions/password-reset-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await requestPasswordReset({ email });
    setIsSubmitting(false);
    setMessage(result.message ?? null);
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-espresso">Reset your password</h1>
        <p className="mt-2 text-sm text-espresso-soft">
          <Link href="/login" className="font-medium text-brass hover:underline">
            Back to sign in
          </Link>
        </p>

        {message ? (
          <p className="mt-8 rounded-xl border border-pistachio/30 bg-pistachio/10 p-4 text-sm text-espresso">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <p className="text-sm text-espresso-soft">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <TextField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" size="lg" disabled={isSubmitting || !email} className="disabled:opacity-60">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}
