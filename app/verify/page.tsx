import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVerificationState } from "@/lib/services/verification";
import { VerificationForm } from "@/components/verification-form";

export const metadata = { title: "Get verified" };

export default async function VerifyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");

  const state = await getVerificationState(session.user.id);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        Organiser <span className="brand-text-gradient">verification</span>
      </h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Verified organisers earn a trust badge on their campaigns and can
        withdraw the funds they raise.
      </p>
      <VerificationForm state={state} />
    </div>
  );
}
