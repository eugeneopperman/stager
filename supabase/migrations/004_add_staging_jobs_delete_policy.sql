-- Add missing DELETE policy for staging_jobs table
-- The initial schema only had SELECT, INSERT, and UPDATE policies

-- Allow users to delete their own staging jobs
create policy "Users can delete own staging jobs"
  on public.staging_jobs for delete
  using (auth.uid() = user_id);
