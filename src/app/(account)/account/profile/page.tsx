import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/account/ProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function AccountProfilePage() {
  const session = await auth();
  const user = await db.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl text-espresso">Profile</h1>
        <p className="mt-1 text-sm text-espresso-soft">{user?.email}</p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg text-espresso">Personal information</h2>
        <div className="mt-5">
          <ProfileForm initialName={user?.name ?? ""} initialPhone={user?.phone ?? ""} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg text-espresso">Password</h2>
        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
