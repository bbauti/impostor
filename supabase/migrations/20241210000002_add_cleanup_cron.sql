-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: Supabase uses pg_net instead of http extension for HTTP requests
-- pg_net is already enabled by default in Supabase

-- IMPORTANT: Before running this migration, replace the placeholders below:
-- 1. Replace YOUR_PROJECT_REF with your Supabase project reference (e.g., abc123xyz)
-- 2. Replace YOUR_ANON_KEY with your Supabase anon/public key
--
-- You can find these values in:
-- - Project URL: Settings → API → Project URL (https://YOUR_PROJECT_REF.supabase.co)
-- - Anon key: Settings → API → Project API keys → anon (public)

-- Schedule cleanup job to run every hour
-- This will invoke the cleanup-old-rooms edge function to delete rooms older than 24 hours
SELECT cron.schedule(
  'cleanup-old-rooms',           -- name of the job
  '0 * * * *',                  -- every hour on the hour (cron syntax: minute hour day month weekday)
  $$
  SELECT
    net.http_post(
      url := 'https://gqtdfzeqxdovwepidufd.supabase.co/functions/v1/cleanup-old-rooms',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdGRmemVxeGRvdndlcGlkdWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTY1NzksImV4cCI6MjA4MDY5MjU3OX0._9JlIyyutkegmxR7mMXFL-cTKsB3GbhEdxbDzv9C8yM"}'::jsonb,
      body := '{"hoursOld": 24}'::jsonb
    ) AS request_id;
  $$
);

-- To verify the cron job was created, run:
-- SELECT * FROM cron.job;

-- To unschedule/remove the cron job if needed, run:
-- SELECT cron.unschedule('cleanup-old-rooms');
