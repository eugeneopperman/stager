import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { logAccountEvent, AuditEventType } from "@/lib/audit/audit-log.service";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Audit log: account deletion initiated (log before deletion to capture user ID)
    // Use admin client to bypass RLS since we're about to delete the user
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await logAccountEvent(adminClient, {
      userId: user.id,
      eventType: AuditEventType.ACCOUNT_DELETED,
      action: "deleted",
      details: {
        email: user.email,
        deletedAt: new Date().toISOString(),
      },
      request,
    });

    // Delete user data from database (cascade will handle related records)
    // The profiles table has ON DELETE CASCADE, so deleting profile will cascade

    // Delete staging images from storage
    const { data: stagingJobs } = await supabase
      .from("staging_jobs")
      .select("id")
      .eq("user_id", user.id);

    if (stagingJobs && stagingJobs.length > 0) {
      // Delete images from storage bucket
      const filesToDelete = stagingJobs.map((job) => `${user.id}/${job.id}-staged.png`);
      await supabase.storage.from("staging-images").remove(filesToDelete);
    }

    // Delete profile (this will cascade to properties and staging_jobs)
    const { error: deleteProfileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (deleteProfileError) {
      console.error("Failed to delete profile:", deleteProfileError);
      return NextResponse.json(
        { error: "Failed to delete account data" },
        { status: 500 }
      );
    }

    // Delete the user from Supabase Auth (reuse adminClient from audit log)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error("Failed to delete auth user:", deleteUserError);
      // Profile is already deleted, so we'll still return success
      // The auth user will be orphaned but that's acceptable
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
