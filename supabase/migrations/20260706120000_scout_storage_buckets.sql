-- Snow Scout: private Storage buckets for API cache + user outlier briefs.
-- Server uploads via service role after auth check (no client-side Storage access).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('scout-cache', 'scout-cache', false, 52428800, ARRAY['application/json']::text[]),
  ('scout-briefs', 'scout-briefs', false, 10485760, ARRAY['application/json']::text[])
ON CONFLICT (id) DO NOTHING;