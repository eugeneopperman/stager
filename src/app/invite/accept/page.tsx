"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Loader2, CheckCircle2, XCircle, Users, Coins } from "lucide-react";

interface InvitationDetails {
  id: string;
  email: string;
  initialCredits: number;
  organizationName: string;
  expiresAt: string;
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side hydration before checking token
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't run until client-side hydration is complete
    if (!isMounted) return;

    async function validateAndCheckAuth() {
      if (!token) {
        setError("Invalid invitation link. No token provided.");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
      setUserEmail(user?.email || null);

      // Validate the invitation
      try {
        const response = await fetch(`/api/team/invite/accept?token=${token}`);
        const data = await response.json();

        if (!data.valid) {
          setError(data.error || "This invitation is no longer valid.");
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        console.error("Error validating invitation:", err);
        setError("Failed to validate invitation. Please try again.");
      }

      setLoading(false);
    }

    validateAndCheckAuth();
  }, [token, isMounted]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation.");
        setAccepting(false);
        return;
      }

      if (data.alreadyMember) {
        setSuccess("You are already a member of this organization.");
      } else {
        setSuccess(
          `Successfully joined ${data.organizationName}! You've been allocated ${data.allocatedCredits} credits.`
        );
      }

      // Redirect to team page after a brief delay
      setTimeout(() => {
        router.push("/team");
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Failed to accept invitation. Please try again.");
    }

    setAccepting(false);
  };

  const handleSignUp = () => {
    router.push(`/signup?invitation=${token}`);
  };

  const handleLogin = () => {
    router.push(`/login?redirect=/invite/accept?token=${token}`);
  };

  // Loading state
  if (loading) {
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

  // Error state (invalid or expired invitation)
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white"
            >
              <Home className="h-8 w-8 text-blue-600" />
              Stager
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-950 w-fit">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Invitation Invalid</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white"
            >
              <Home className="h-8 w-8 text-blue-600" />
              Stager
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 dark:bg-green-950 w-fit">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Welcome to the Team!</CardTitle>
              <CardDescription>{success}</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Redirecting you to the team page...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Valid invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white"
          >
            <Home className="h-8 w-8 text-blue-600" />
            Stager
          </Link>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            AI-powered virtual staging for real estate
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Invitation
            </CardTitle>
            <CardDescription>
              You&apos;ve been invited to join <strong>{invitation?.organizationName}</strong> on Stager
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {invitation?.initialCredits ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Coins className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {invitation.initialCredits} credits allocated
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Ready to use for virtual staging
                  </p>
                </div>
              </div>
            ) : null}

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <p className="text-sm text-muted-foreground">
                Invitation sent to: <strong>{invitation?.email}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {isLoggedIn && userEmail?.toLowerCase() !== invitation?.email.toLowerCase() && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                You are logged in as <strong>{userEmail}</strong>. This invitation was sent to{" "}
                <strong>{invitation?.email}</strong>. Please log in with the correct account.
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {isLoggedIn ? (
              userEmail?.toLowerCase() === invitation?.email.toLowerCase() ? (
                <Button onClick={handleAccept} disabled={accepting} className="w-full">
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Accept Invitation"
                  )}
                </Button>
              ) : (
                <Button onClick={handleLogin} variant="outline" className="w-full">
                  Log in with different account
                </Button>
              )
            ) : (
              <>
                <Button onClick={handleSignUp} className="w-full">
                  Sign up to accept
                </Button>
                <Button onClick={handleLogin} variant="outline" className="w-full">
                  I already have an account
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
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
      <InviteAcceptContent />
    </Suspense>
  );
}
