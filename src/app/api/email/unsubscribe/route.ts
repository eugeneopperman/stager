import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  unsubscribeAll,
  unsubscribeCategory,
  EmailCategory,
} from "@/lib/email/preferences";

// POST /api/email/unsubscribe - Unsubscribe from emails
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const category = searchParams.get("category") as EmailCategory | null;

    // If token provided, extract user info from it (for one-click unsubscribe)
    let userId: string | null = null;

    if (token) {
      try {
        const decoded = JSON.parse(
          Buffer.from(token, "base64url").toString("utf-8")
        );
        userId = decoded.userId;

        // Check token age (7 days max)
        const tokenAge = Date.now() - decoded.timestamp;
        if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
          return NextResponse.json(
            { error: "Unsubscribe link has expired" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid unsubscribe token" },
          { status: 400 }
        );
      }
    } else {
      // Fallback to authenticated user
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized or invalid token" },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unable to identify user" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate category if provided
    const validCategories: EmailCategory[] = [
      "marketing_emails",
      "product_updates",
      "weekly_digest",
      "staging_notifications",
      "team_notifications",
    ];

    let result;
    if (category && validCategories.includes(category)) {
      result = await unsubscribeCategory(supabase, userId, category);
    } else {
      result = await unsubscribeAll(supabase, userId);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to unsubscribe" },
        { status: 500 }
      );
    }

    // Return HTML response for browser redirects
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribed - Stager</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #f4f4f5;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                max-width: 400px;
              }
              h1 { color: #18181b; margin: 0 0 16px; }
              p { color: #71717a; margin: 0 0 24px; }
              a {
                color: #7c3aed;
                text-decoration: none;
                font-weight: 500;
              }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>You've been unsubscribed</h1>
              <p>
                ${category
                  ? `You will no longer receive ${category.replace(/_/g, " ")} emails.`
                  : "You will no longer receive marketing emails from Stager."}
              </p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://stager.app"}/settings?tab=notifications">
                  Manage email preferences
                </a>
              </p>
            </div>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return NextResponse.json({
      message: category
        ? `Unsubscribed from ${category}`
        : "Unsubscribed from all marketing emails",
    });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET handler for one-click unsubscribe links
export async function GET(request: NextRequest) {
  return POST(request);
}
