"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Container } from "@/components/ui/Container";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      // "CredentialsSignin" is the only error that means the details were
      // checked and rejected. Anything else (e.g. the database being
      // unreachable) is our problem, not a wrong password — saying "wrong
      // password" there sends people off resetting a password that's fine.
      setError(
        result.code === "email_not_verified"
          ? "Please verify your email before signing in — check your inbox for the link."
          : result.error === "CredentialsSignin"
            ? "That email or password isn't right. Please try again."
            : "We couldn't sign you in right now because of a problem on our end. Please try again in a few minutes.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-espresso">Sign in</h1>
        <p className="mt-2 text-sm text-espresso-soft">
          New here? <Link href="/register" className="font-medium text-brass hover:underline">Create an account</Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-espresso-soft hover:text-espresso">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={isSubmitting} className="disabled:opacity-60">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
