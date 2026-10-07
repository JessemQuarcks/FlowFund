"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type Initial = { name: string; email: string; image: string | null };

type Status = { kind: "idle" | "ok" | "error"; message?: string };

export function ProfileForm({
  initial,
  hasPassword,
}: {
  initial: Initial;
  hasPassword: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [preview, setPreview] = useState<string | null>(initial.image);
  const fileRef = useRef<HTMLInputElement>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>({ kind: "idle" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>({
    kind: "idle",
  });

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus({ kind: "idle" });
    try {
      const file = fileRef.current?.files?.[0];
      if (file) {
        const form = new FormData();
        form.append("image", file);
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Could not upload the image");
        }
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Could not save your profile");
      }
      setProfileStatus({ kind: "ok", message: "Profile saved" });
      router.refresh();
    } catch (err) {
      setProfileStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not save",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Could not change your password");
      }
      setPasswordStatus({ kind: "ok", message: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not change",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (name || initial.email).slice(0, 2).toUpperCase();

  return (
    <Tabs defaultValue="profile">
      <TabsList className="mb-6">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your name and profile photo
            </CardDescription>
          </CardHeader>
          <form onSubmit={saveProfile}>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <Avatar className="h-24 w-24">
                  {preview && <AvatarImage src={preview} alt={name} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile photo</Label>
                  <Input
                    id="avatar"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickImage}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP, GIF or AVIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={initial.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email can&apos;t be changed here.
                </p>
              </div>

              {profileStatus.kind !== "idle" && (
                <p
                  className={
                    profileStatus.kind === "ok"
                      ? "text-sm text-green-600"
                      : "text-sm text-red-600"
                  }
                >
                  {profileStatus.message}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" variant="gradient" disabled={savingProfile}>
                {savingProfile && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Profile
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>
              {hasPassword ? "Change password" : "Set a password"}
            </CardTitle>
            <CardDescription>
              {hasPassword
                ? "Update the password you use to sign in"
                : "Add a password so you can sign in with email too"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={savePassword}>
            <CardContent className="space-y-4">
              {hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with a number and a special character.
                </p>
              </div>

              {passwordStatus.kind !== "idle" && (
                <p
                  className={
                    passwordStatus.kind === "ok"
                      ? "text-sm text-green-600"
                      : "text-sm text-red-600"
                  }
                >
                  {passwordStatus.message}
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="submit"
                variant="gradient"
                disabled={savingPassword}
              >
                {savingPassword && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {hasPassword ? "Change Password" : "Set Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
