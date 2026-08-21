-- Adversarial-review hardening: make the audited service layer the ONLY write
-- path for customers, and stop internal files leaking through storage RLS.
--
-- Findings addressed:
--   1. project-files storage read policy granted access to a customer's whole
--      project folder regardless of a file's visibility, so a customer with
--      their own access token could read internal deliverables straight from
--      Supabase Storage, bypassing the app's visibility check. The customer
--      storage insert + project_files metadata insert policies were also an
--      unaudited write path.
--   2. requests / request_comments client insert policies let a customer write
--      rows directly via PostgREST, skipping the activity_log entry the service
--      layer records.
--
-- The application already performs every one of these writes through the
-- service-role client (see src/app/portal/(app)/actions.ts and
-- src/lib/portal/services/*), and downloads through short-lived, service-role
-- signed URLs (src/lib/portal/services/files.ts) that do not depend on the
-- customer's own storage grants. So removing these policies changes nothing an
-- honest customer can do through the app — it only closes the raw-API bypass.
--
-- Kept: the client SELECT policies (customers still read their own rows) and
-- the admin storage policy.

-- 1a. No direct customer storage access (read or write).
drop policy if exists project_files_storage_client_read on storage.objects;
drop policy if exists project_files_storage_client_insert on storage.objects;

-- 1b. No direct customer file-metadata inserts.
drop policy if exists project_files_client_insert on project_files;

-- 2. No direct customer request / comment inserts.
drop policy if exists requests_client_insert on requests;
drop policy if exists request_comments_client_insert on request_comments;
