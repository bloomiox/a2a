-- Fix Audio Bucket Policies
-- Run these commands in your Supabase SQL Editor to fix audio file access

-- 1. Ensure the bucket is public (allows public URL generation)
UPDATE storage.buckets 
SET public = true 
WHERE name = 'audio-files';

-- 2. Allow public access to read/download audio files
-- This is the key policy that's likely missing
CREATE POLICY "Allow public downloads from audio-files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');

-- 3. Allow authenticated users to upload audio files
-- This ensures uploads continue to work
CREATE POLICY "Allow authenticated uploads to audio-files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- 4. Optional: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to audio-files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'audio-files')
WITH CHECK (bucket_id = 'audio-files');

-- 5. Optional: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes from audio-files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-files');

-- 6. Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%audio-files%';

-- 7. Verify bucket configuration
SELECT id, name, public, created_at, updated_at
FROM storage.buckets 
WHERE name = 'audio-files';