"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, ImageIcon, CreditCard, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/notifications";
import { useNotificationsSWR } from "@/hooks/useNotificationsSWR";
import type { Notification, NotificationType } from "@/lib/database.types";
import { useRouter } from "next/navigation";

const notificationIcons: Record<NotificationType, typeof ImageIcon> = {
  staging_complete: ImageIcon,
  staging_failed: X,
  low_credits: CreditCard,
};

const notificationColors: Record<NotificationType, string> = {
  staging_complete: "text-emerald-500",
  staging_failed: "text-red-500",
  low_credits: "text-amber-500",
};

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  // Use SWR hook for notifications
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationsSWR(userId);

  // Fetch notifications when opening
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && userId) {
      await refetch();
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate if link exists
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notification: Notification
  ) => {
    e.stopPropagation();
    await deleteNotification(notification);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-tour="notifications"
          className={cn(
            "relative h-10 w-10 rounded-full",
            "bg-card/80 backdrop-blur-xl",
            "border border-black/[0.08] dark:border-white/[0.12]",
            "shadow-lg",
            "hover:bg-card"
          )}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                "min-w-5 h-5 px-1 rounded-full",
                "bg-primary text-primary-foreground",
                "text-xs font-semibold",
                "ring-2 ring-card"
              )}
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Notifications</span>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Mark all as read</p>
                </TooltipContent>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={deleteAllNotifications}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Clear all</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                We&apos;ll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative w-full flex items-start gap-3 px-4 py-3 text-left",
                      "transition-colors duration-150",
                      "hover:bg-accent/50 dark:hover:bg-white/5",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    {/* Clickable area for notification */}
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="absolute inset-0 w-full h-full"
                      aria-label={`View ${notification.title}`}
                    />

                    {/* Unread indicator */}
                    <div className="mt-1.5 shrink-0">
                      {!notification.is_read ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : (
                        <div className="h-2 w-2" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className={cn("p-2 rounded-full bg-muted/50 shrink-0", iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.is_read
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Delete button - appears on hover */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notification)}
                      className={cn(
                        "relative z-10 p-1.5 rounded-full shrink-0",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-150",
                        "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                        "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/50"
                      )}
                      aria-label="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
