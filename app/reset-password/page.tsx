"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { ArrowLeft, CheckCircle, Loader2, TrendingUp } from "lucide-react";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Could not reset your password");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="text-xl text-center">Invalid link</CardTitle>
          <CardDescription className="text-center">
            This reset link is missing its token. Request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link
            href="/forgotpassword"
            className="text-sm text-primary-600 hover:underline"
          >
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="gradient-card">
        <CardContent className="pt-6 pb-4 text-center space-y-4">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-primary-600" />
          </div>
          <CardTitle className="text-xl">Password updated</CardTitle>
          <p className="text-muted-foreground">
            You can now sign in with your new password.
          </p>
          <Link href="/signin">
            <Button variant="gradient">Go to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Choose a new password
        </CardTitle>
        <CardDescription className="text-center">
          Enter a new password for your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-white bg-destructive rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters, with a number and a special character.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            variant="gradient"
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex justify-center">
        <Link
          href="/signin"
          className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-black">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold green-text-gradient">
              FlowFund
            </span>
          </Link>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
