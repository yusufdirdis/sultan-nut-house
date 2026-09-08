import { Resend } from "resend";
import type { EmailProvider } from "@/integrations/email/types";

export function createResendProvider(apiKey: string, fromAddress: string): EmailProvider {
  const client = new Resend(apiKey);

  return {
    async send(input) {
      const { error } = await client.emails.send({
        from: fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        console.error("[email:resend] send failed", error);
        throw new Error("Failed to send email");
      }
    },
  };
}
