# Audio Storage Troubleshooting Guide

## Problem Description

When adding audio tracks to tour stops, you may encounter errors like:
- "The audio file may not have been uploaded properly or is not accessible"
- "Audio not available" 
- HTTP 403/404 errors when trying to access audio files
- Audio files upload but don't play

The root cause is typically Supabase storage configuration issues with the `audio-files` bucket.

## Quick Diagnosis

### Method 1: Use the Diagnostic Page
1. Navigate to `/audio-diagnostic` in your app
2. Click "Run Diagnostic" 
3. Follow the recommendations provided

### Method 2: Browser Console Check
1. Open your browser's developer console (F12)
2. Import and run the quick fix:
```javascript
import('/src/utils/quickAudioFix.js').then(module => {
  module.quickAudioStorageFix().then(results => {
    console.log('Fix results:', results);
  });
});
```

### Method 3: Manual URL Test
If you have an audio file URL that's failing, test it directly:
1. Copy the failing audio URL from the error message
2. Open it in a new browser tab
3. If it shows 404/403, the issue is storage configuration

## Common Issues and Solutions

### Issue 1: Bucket Doesn't Exist
**Error**: "Bucket not found" or "audio-files bucket does not exist"

**Solution**: Create the bucket in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** section
3. Click **"Create bucket"**
4. Name it `audio-files`
5. Set it to **Public** (recommended for audio playback)
6. Click **Create**

### Issue 2: Upload Permission Denied
**Error**: "Permission denied" or "row-level security policy"

**Solution**: Configure RLS policies
1. Go to **Storage** > **audio-files** > **Policies**
2. Add the following policies using the SQL editor:

```sql
-- Allow authenticated users to upload audio files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- Allow public access to audio files (for playback)
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');

-- Optional: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Issue 3: Files Upload But Aren't Accessible
**Error**: Files upload successfully but return 403/404 when accessed

**Solution**: Make bucket public or fix access policies
1. Go to **Storage** > **audio-files**
2. Click the **Settings** tab
3. Toggle **"Public bucket"** to ON
4. Or ensure the SELECT policy above is properly configured

### Issue 4: CORS Issues
**Error**: CORS errors when accessing audio files

**Solution**: Configure CORS in Supabase
1. Go to **Settings** > **API**
2. Add your domain to **CORS origins**
3. Include both your development (`http://localhost:5173`) and production URLs

## Step-by-Step Setup Guide

### 1. Create Storage Bucket
```sql
-- Run in Supabase SQL Editor if needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true);
```

### 2. Set Up Policies
```sql
-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Upload policy
CREATE POLICY "Allow authenticated uploads to audio-files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- Download policy  
CREATE POLICY "Allow public downloads from audio-files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');

-- Update policy (optional)
CREATE POLICY "Allow authenticated updates to audio-files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'audio-files')
WITH CHECK (bucket_id = 'audio-files');

-- Delete policy (optional)
CREATE POLICY "Allow authenticated deletes from audio-files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-files');
```

### 3. Test Configuration
Run this test in your browser console:
```javascript
// Test upload
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
supabase.storage.from('audio-files').upload('test.txt', testFile)
  .then(result => console.log('Upload test:', result));

// Test public access
supabase.storage.from('audio-files').getPublicUrl('test.txt')
  .then(result => {
    fetch(result.data.publicUrl)
      .then(response => console.log('Access test:', response.status));
  });
```

## Environment Variables Check

Ensure your `.env` file has the correct Supabase configuration:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supported Audio Formats

The system supports these audio formats:
- **MP3** (recommended)
- **WAV** 
- **OGG**
- **M4A**
- **AAC**

## File Size Limits

- Maximum file size: 50MB (Supabase default)
- Recommended: Keep audio files under 10MB for better performance
- Use compressed formats like MP3 for optimal loading times

## Advanced Troubleshooting

### Check Storage Usage
```sql
-- Check storage usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects 
WHERE bucket_id = 'audio-files'
GROUP BY bucket_id;
```

### List Bucket Policies
```sql
-- View current policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

### Check Bucket Configuration
```sql
-- View bucket settings
SELECT * FROM storage.buckets WHERE name = 'audio-files';
```

## Prevention Tips

1. **Always test uploads** after setting up a new environment
2. **Use the diagnostic page** regularly to check storage health
3. **Monitor storage usage** to avoid hitting limits
4. **Keep backups** of important audio files
5. **Use consistent naming** for audio files to avoid conflicts

## Getting Help

If you're still experiencing issues:

1. **Check the diagnostic page** at `/audio-diagnostic`
2. **Review Supabase logs** in your dashboard
3. **Test with a simple audio file** first
4. **Verify your Supabase project** has storage enabled
5. **Check your subscription limits** if using Supabase Pro

## Related Files

- `src/components/create/AudioRecorder.jsx` - Audio upload component
- `src/components/play/AudioController.jsx` - Audio playback component  
- `src/api/integrations.js` - File upload functions
- `src/utils/audioStorageDiagnostic.js` - Diagnostic utilities
- `src/utils/storageCheck.js` - Storage configuration checker

## Quick Reference Commands

```bash
# Navigate to diagnostic page
/audio-diagnostic

# Test audio upload
/create

# Test audio playback  
/play

# Check Supabase dashboard
https://supabase.com/dashboard
```