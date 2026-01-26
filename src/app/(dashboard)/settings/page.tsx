import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, Palette, PanelLeft, HelpCircle } from "lucide-react";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordSection } from "./_components/PasswordSection";
import { DangerZone } from "./_components/DangerZone";
import { ThemeSelector } from "./_components/ThemeSelector";
import { SidebarSettings } from "./_components/SidebarSettings";
import { HelpSettings } from "./_components/HelpSettings";

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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize how Stager looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Navigation Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PanelLeft className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Navigation</CardTitle>
          </div>
          <CardDescription>
            Configure sidebar behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SidebarSettings />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Help</CardTitle>
          </div>
          <CardDescription>
            Get help with using Stager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpSettings
            credits={profile?.credits_remaining || 0}
            userName={profile?.full_name?.split(" ")[0]}
          />
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
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
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p className="font-medium text-foreground">
                Email Address
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="success">
              Verified
            </Badge>
          </div>

          {/* Password */}
          <PasswordSection />

          {/* Member Since */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">
                Member Since
              </p>
              <p className="text-sm text-muted-foreground">
                {profile?.created_at ? formatDate(profile.created_at) : "Unknown"}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
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
