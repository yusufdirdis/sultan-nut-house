"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/server/actions/account-actions";

export function ProfileForm({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);
    const result = await updateProfile({ name, phone });
    setIsSubmitting(false);
    setMessage({ type: result.success ? "success" : "error", text: result.message ?? "" });
    if (result.success) router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField id="profile-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField id="profile-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      {message && <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-pistachio"}>{message.text}</p>}
      <Button type="button" variant="brass" disabled={isSubmitting || !name} onClick={handleSubmit} className="w-fit disabled:opacity-60">
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
