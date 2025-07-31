// Fix Audio Bucket Policies - Targeted solution for existing bucket with files
import { supabase } from '@/api/supabaseClient';

export const fixAudioBucketPolicies = async () => {
  console.log('🔧 Fixing audio-files bucket policies...');
  
  const results = {
    steps: [],
    success: false,
    message: '',
    sqlCommands: []
  };

  try {
    // Step 1: Check current bucket status
    console.log('📋 Step 1: Checking bucket status...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.steps.push({ step: 1, status: 'error', message: `Cannot access buckets: ${bucketsError.message}` });
      return results;
    }

    const audioBucket = buckets.find(bucket => bucket.name === 'audio-files');
    if (!audioBucket) {
      results.steps.push({ step: 1, status: 'error', message: 'audio-files bucket not found' });
      return results;
    }

    results.steps.push({ 
      step: 1, 
      status: 'success', 
      message: `Bucket exists (public: ${audioBucket.public})` 
    });

    // Step 2: Test current access to existing files
    console.log('📋 Step 2: Testing access to existing files...');
    const { data: files, error: listError } = await supabase.storage
      .from('audio-files')
      .list('', { limit: 1 });

    if (listError) {
      results.steps.push({ 
        step: 2, 
        status: 'error', 
        message: `Cannot list files: ${listError.message}` 
      });
      
      if (listError.message.includes('row-level security')) {
        results.message = 'RLS policies are blocking access to files';
        results.sqlCommands = [
          {
            description: 'Allow public access to read files',
            sql: `CREATE POLICY "Allow public downloads from audio-files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');`
          },
          {
            description: 'Allow authenticated users to upload files',
            sql: `CREATE POLICY "Allow authenticated uploads to audio-files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');`
          }
        ];
      }
      return results;
    }

    results.steps.push({ 
      step: 2, 
      status: 'success', 
      message: `Can list files (${files.length} files found)` 
    });

    // Step 3: Test public URL access
    console.log('📋 Step 3: Testing public URL access...');
    if (files.length > 0) {
      const testFile = files[0];
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(testFile.name);

      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        
        if (response.ok) {
          results.steps.push({ 
            step: 3, 
            status: 'success', 
            message: 'Files are publicly accessible' 
          });
          results.success = true;
          results.message = 'Audio storage is working correctly!';
        } else {
          results.steps.push({ 
            step: 3, 
            status: 'error', 
            message: `Public access failed: HTTP ${response.status}` 
          });
          
          if (response.status === 403) {
            results.message = 'Files exist but are not publicly accessible due to RLS policies';
            results.sqlCommands = [
              {
                description: 'Allow public access to read files',
                sql: `CREATE POLICY "Allow public downloads from audio-files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');`
              }
            ];
          } else if (response.status === 404) {
            results.message = 'Files exist in bucket but public URLs are not working';
            results.sqlCommands = [
              {
                description: 'Make bucket public (if not already)',
                sql: `UPDATE storage.buckets 
SET public = true 
WHERE name = 'audio-files';`
              },
              {
                description: 'Allow public access to read files',
                sql: `CREATE POLICY "Allow public downloads from audio-files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');`
              }
            ];
          }
        }
      } catch (fetchError) {
        results.steps.push({ 
          step: 3, 
          status: 'error', 
          message: `Network error testing access: ${fetchError.message}` 
        });
        results.message = 'Cannot test file access due to network issues';
      }
    } else {
      results.steps.push({ 
        step: 3, 
        status: 'warning', 
        message: 'No files to test access with' 
      });
    }

  } catch (error) {
    results.steps.push({ 
      step: 'unknown', 
      status: 'error', 
      message: error.message 
    });
    results.message = `Diagnostic failed: ${error.message}`;
  }

  console.log('🏁 Policy fix diagnostic completed');
  console.log('📊 Results:', results);
  
  return results;
};

// Test a specific audio URL
export const testAudioUrl = async (audioUrl) => {
  console.log('🎵 Testing specific audio URL:', audioUrl);
  
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    
    const result = {
      url: audioUrl,
      status: response.status,
      accessible: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    console.log('🎵 URL test result:', result);
    return result;
  } catch (error) {
    console.error('🎵 URL test failed:', error);
    return {
      url: audioUrl,
      status: 'error',
      accessible: false,
      error: error.message
    };
  }
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  window.fixAudioBucketPolicies = fixAudioBucketPolicies;
  window.testAudioUrl = testAudioUrl;
}

export default fixAudioBucketPolicies;