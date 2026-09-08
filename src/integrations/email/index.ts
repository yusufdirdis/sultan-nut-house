import type { EmailProvider } from "@/integrations/email/types";
import { consoleEmailProvider } from "@/integrations/email/console-provider";
import { createResendProvider } from "@/integrations/email/resend-provider";

function buildEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (apiKey && fromAddress) {
    return createResendProvider(apiKey, fromAddress);
  }

  return consoleEmailProvider;
}

export const emailProvider = buildEmailProvider();
export type { EmailProvider, SendEmailInput } from "@/integrations/email/types";
