"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
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
import { TrendingUp, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      setIsSubmitting(false);
      return;
    }

    // TODO: Implement password reset functionality

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-black">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold green-text-gradient">
              FundFlow
            </span>
          </Link>
        </div>

        <Card className="gradient-card">
          {!isSubmitted ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  Forgot Password
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your email address and we'll send you a link to reset
                  your password
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-white bg-destructive rounded-md">
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    variant="gradient"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </CardContent>
              </form>
            </>
          ) : (
            <CardContent className="pt-6 pb-4 text-center space-y-4">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-12 w-12 text-primary-600" />
              </div>
              <CardTitle className="text-xl">Check Your Email</CardTitle>
              <p className="text-muted-foreground">
                We've sent a password reset link to{" "}
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see it, please check your spam folder.
              </p>
            </CardContent>
          )}
          <CardFooter className="flex justify-center">
            <Link
              href="/signin"
              className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
