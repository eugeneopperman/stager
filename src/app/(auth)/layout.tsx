import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Auth Layout - Handles redirect for logged-in users
 *
 * Next.js 16 best practice: Auth checks should be in layouts, not proxy.
 * This layout protects /login and /signup routes by redirecting
 * authenticated users to the dashboard.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logged-in users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
