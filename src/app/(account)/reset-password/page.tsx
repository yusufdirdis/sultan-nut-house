import { Container } from "@/components/ui/Container";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-espresso">Set a new password</h1>

        {token && email ? (
          <ResetPasswordForm token={token} email={email} />
        ) : (
          <p className="mt-8 text-espresso-soft">This reset link is missing information. Please request a new one.</p>
        )}
      </div>
    </Container>
  );
}
