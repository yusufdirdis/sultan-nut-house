"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { registerUser } from "@/server/actions/auth-actions";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle" });

    const result = await registerUser({ name, email, password });
    setStatus({ type: result.success ? "success" : "error", message: result.message });
    setIsSubmitting(false);
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-espresso">Create your account</h1>
        <p className="mt-2 text-sm text-espresso-soft">
          Already have one? <Link href="/login" className="font-medium text-brass hover:underline">Sign in</Link>
        </p>

        {status.type === "success" ? (
          <p className="mt-8 rounded-xl border border-pistachio/30 bg-pistachio/10 p-4 text-sm text-espresso">
            {status.message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <TextField
              label="Full name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
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
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {status.type === "error" && <p className="text-sm text-red-600">{status.message}</p>}
            <Button type="submit" size="lg" disabled={isSubmitting} className="disabled:opacity-60">
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}
      </div>
    </Container>
  );
}
