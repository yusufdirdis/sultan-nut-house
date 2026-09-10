"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/server/actions/account-actions";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);
    const result = await changePassword({ currentPassword, newPassword });
    setIsSubmitting(false);
    setMessage({ type: result.success ? "success" : "error", text: result.message ?? "" });

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => signOut({ callbackUrl: "/login" }), 1200);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <TextField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      {message && <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-pistachio"}>{message.text}</p>}
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || !currentPassword || newPassword.length < 8}
        onClick={handleSubmit}
        className="w-fit disabled:opacity-60"
      >
        {isSubmitting ? "Changing…" : "Change password"}
      </Button>
    </div>
  );
}
