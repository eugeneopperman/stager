import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!query || query.length < 2) {
    return NextResponse.json({ properties: [], stagingJobs: [] });
  }

  // Search properties by address and description
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address, description")
    .eq("user_id", user.id)
    .or(`address.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(5);

  // Search staging jobs by room_type and style
  // Also include jobs where the associated property matches
  const { data: stagingJobs } = await supabase
    .from("staging_jobs")
    .select(`
      id,
      room_type,
      style,
      staged_image_url,
      status,
      created_at,
      property:properties(id, address)
    `)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .or(`room_type.ilike.%${query}%,style.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    properties: properties || [],
    stagingJobs: stagingJobs || [],
  });
}
