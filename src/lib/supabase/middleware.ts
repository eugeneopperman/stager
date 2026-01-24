import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookies on each request.
 *
 * Next.js 16 best practice: proxy.ts should only handle routing concerns
 * (rewrites, redirects, headers, cookie refresh). Auth checks should be
 * handled in layouts and route handlers.
 *
 * This function ONLY refreshes cookies - auth redirects are handled by:
 * - src/app/(dashboard)/layout.tsx - protects dashboard routes
 * - src/app/(auth)/layout.tsx - redirects logged-in users from auth pages
 */
export async function refreshSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // This call refreshes the session and updates cookies if needed
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * @deprecated Use refreshSession instead. Auth redirects should be in layouts.
 */
export const updateSession = refreshSession;
