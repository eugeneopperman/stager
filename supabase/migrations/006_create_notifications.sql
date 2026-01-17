-- Create notifications table for persistent user notifications
CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('staging_complete', 'staging_failed', 'low_credits')),
  title text NOT NULL,
  message text NOT NULL,
  link text,  -- Optional link to navigate to (e.g., /history, /billing)
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for API routes creating notifications)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
