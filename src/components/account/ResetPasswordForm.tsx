"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { resetPassword } from "@/server/actions/password-reset-actions";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await resetPassword({ token, email, newPassword });
    setIsSubmitting(false);
    setMessage({ type: result.success ? "success" : "error", text: result.message ?? "" });

    if (result.success) {
      setTimeout(() => router.push("/login"), 1500);
    }
  }

  if (message?.type === "success") {
    return <p className="mt-8 rounded-xl border border-pistachio/30 bg-pistachio/10 p-4 text-sm text-espresso">{message.text}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <TextField
        id="reset-new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
      />
      {message?.type === "error" && <p className="text-sm text-red-600">{message.text}</p>}
      <Button type="submit" size="lg" disabled={isSubmitting || newPassword.length < 8} className="disabled:opacity-60">
        {isSubmitting ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
