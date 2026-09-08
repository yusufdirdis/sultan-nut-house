import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { verifyEmail } from "@/server/actions/auth-actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  const result =
    token && email
      ? await verifyEmail(token, email)
      : { success: false, message: "This verification link is missing information." };

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-3xl text-espresso">
          {result.success ? "You're verified" : "Verification failed"}
        </h1>
        <p className="mt-4 text-espresso-soft">{result.message}</p>
        <Button href={result.success ? "/login" : "/register"} className="mt-8">
          {result.success ? "Sign in" : "Back to registration"}
        </Button>
        {!result.success && (
          <p className="mt-4 text-sm text-espresso-soft">
            Need a new link? <Link href="/register" className="text-brass hover:underline">Register again</Link> or
            contact us.
          </p>
        )}
      </div>
    </Container>
  );
}
