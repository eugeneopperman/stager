"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Palette, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  credits: number;
  userName?: string;
  skipDbUpdate?: boolean;
}

export function WelcomeOnboardingModal({
  isOpen,
  onClose,
  credits,
  userName,
  skipDbUpdate = false,
}: WelcomeOnboardingModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(isOpen);

  const markOnboardingComplete = async () => {
    if (skipDbUpdate) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Failed to mark onboarding complete:", error);
    }
  };

  const handleStagePhoto = async () => {
    await markOnboardingComplete();
    setOpen(false);
    onClose?.();
    router.push("/stage");
  };

  const handleDismiss = async () => {
    await markOnboardingComplete();
    setOpen(false);
    onClose?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleDismiss();
    }
  };

  const greeting = userName ? `Welcome, ${userName}!` : "Welcome to Stager!";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{greeting}</DialogTitle>
          <DialogDescription className="text-base">
            Transform empty rooms into beautifully staged spaces in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Free credits banner */}
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              {credits} Free Credits
            </p>
            <p className="text-sm text-green-600 dark:text-green-500">
              Ready to use on your first stagings
            </p>
          </div>

          {/* Value props */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Upload your photo</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or select an empty room photo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Choose your style</p>
                <p className="text-sm text-muted-foreground">
                  Select from modern, traditional, minimalist and more
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Get instant results</p>
                <p className="text-sm text-muted-foreground">
                  AI generates a professionally staged image
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" size="lg" onClick={handleStagePhoto}>
            Stage Your First Photo
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
          >
            I&apos;ll explore on my own
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
