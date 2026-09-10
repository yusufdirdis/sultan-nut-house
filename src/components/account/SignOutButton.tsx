"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="shrink-0 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-espresso-soft transition-colors hover:bg-white hover:text-espresso"
    >
      Sign out
    </button>
  );
}
