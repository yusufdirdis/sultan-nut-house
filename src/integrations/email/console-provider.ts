import type { EmailProvider } from "@/integrations/email/types";

/**
 * Dev-only fallback: logs the email instead of sending it, so local
 * development and tests work without a Resend account. Never selected when
 * RESEND_API_KEY is set — see index.ts.
 */
export const consoleEmailProvider: EmailProvider = {
  async send(input) {
    console.log(`[email:console] to=${input.to} subject="${input.subject}"\n${input.text ?? input.html}`);
  },
};
