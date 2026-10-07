import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">
          Please{" "}
          <Link href="/signin" className="underline">
            sign in
          </Link>{" "}
          to manage your profile.
        </p>
      </div>
    );
  }

  // Read the password flag server-side; only a boolean reaches the client,
  // never the hash.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    omit: { password: false },
  });
  if (!user) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      <ProfileForm
        initial={{
          name: user.name ?? "",
          email: user.email,
          image: user.image,
        }}
        hasPassword={!!user.password}
      />
    </div>
  );
}
