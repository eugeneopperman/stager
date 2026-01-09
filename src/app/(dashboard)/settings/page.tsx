import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Mail, Calendar, Shield } from "lucide-react";
import { ProfileForm } from "./ProfileForm";
import { PasswordSection } from "./PasswordSection";
import { DangerZone } from "./DangerZone";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-500" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={profile?.full_name || ""}
            initialCompany={profile?.company_name || ""}
          />
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-500" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Email Address
              </p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Verified
            </Badge>
          </div>

          {/* Password */}
          <PasswordSection />

          {/* Member Since */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Member Since
              </p>
              <p className="text-sm text-slate-500">
                {profile?.created_at ? formatDate(profile.created_at) : "Unknown"}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
