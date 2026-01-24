"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Loader2, Users, Coins } from "lucide-react";

interface InvitationInfo {
  email: string;
  organizationName: string;
  initialCredits: number;
}

function SignupContent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const invitationToken = searchParams.get("invitation");

  // Fetch invitation details if token is provided
  useEffect(() => {
    async function fetchInvitation() {
      if (!invitationToken) return;

      setLoadingInvitation(true);
      try {
        const response = await fetch(
          `/api/team/invite/accept?token=${invitationToken}`
        );
        const data = await response.json();

        if (data.valid) {
          setInvitation({
            email: data.invitation.email,
            organizationName: data.invitation.organizationName,
            initialCredits: data.invitation.initialCredits,
          });
          // Pre-fill the email from the invitation
          setEmail(data.invitation.email);
        }
      } catch (err) {
        console.error("Error fetching invitation:", err);
      }
      setLoadingInvitation(false);
    }

    fetchInvitation();
  }, [invitationToken]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    // If there's an invitation, verify email matches
    if (invitation && email.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(
        `Please sign up with the email the invitation was sent to: ${invitation.email}`
      );
      setLoading(false);
      return;
    }

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // If there's an invitation token, accept it
    if (invitationToken) {
      try {
        const response = await fetch("/api/team/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: invitationToken }),
        });

        const data = await response.json();

        if (response.ok) {
          // Redirect to team page on success
          router.push("/team");
          router.refresh();
          return;
        } else {
          // Still signed up, but invitation might have issues
          console.error("Error accepting invitation:", data.error);
        }
      } catch (err) {
        console.error("Error accepting invitation:", err);
      }
    }

    // Default redirect to dashboard
    router.push("/dashboard");
    router.refresh();
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <Home className="h-8 w-8 text-blue-600" aria-hidden="true" />
            Stager
          </Link>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            AI-powered virtual staging for real estate
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle as="h1">Create an account</CardTitle>
            <CardDescription>
              {invitation
                ? `Join ${invitation.organizationName} on Stager`
                : "Get started with 10 free staging credits"}
            </CardDescription>
          </CardHeader>

          {/* Invitation banner */}
          {invitation && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Team Invitation
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Joining {invitation.organizationName}
                  </p>
                </div>
              </div>
              {invitation.initialCredits > 0 && (
                <div className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <Coins className="h-5 w-5 text-green-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {invitation.initialCredits} credits waiting
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Allocated for you to use
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSignup} noValidate>
            <CardContent className="space-y-4">
              {error && (
                <div
                  id="signup-error"
                  role="alert"
                  aria-live="assertive"
                  className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-lg"
                >
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "signup-error" : undefined}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={invitation ? "email-invitation-note signup-error" : error ? "signup-error" : undefined}
                  disabled={loading || !!invitation}
                />
                {invitation && (
                  <p id="email-invitation-note" className="text-xs text-muted-foreground">
                    This email is linked to your team invitation
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "signup-error" : undefined}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? "signup-error" : undefined}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Creating account...</span>
                  </>
                ) : invitation ? (
                  "Create account & join team"
                ) : (
                  "Create account"
                )}
              </Button>
              <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href={
                    invitationToken
                      ? `/login?redirect=/invite/accept?token=${invitationToken}`
                      : "/login"
                  }
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
