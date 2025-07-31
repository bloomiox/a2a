// Quick Audio Storage Fix Script
// Run this in your browser console to diagnose and fix audio storage issues

import { supabase } from '@/api/supabaseClient';

export const quickAudioStorageFix = async () => {
  console.log('🔧 Quick Audio Storage Fix Starting...');
  
  const results = {
    steps: [],
    success: false,
    message: ''
  };

  try {
    // Step 1: Check if audio-files bucket exists
    console.log('📋 Step 1: Checking if audio-files bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.steps.push({ step: 1, status: 'error', message: `Cannot list buckets: ${bucketsError.message}` });
      results.message = 'Cannot access Supabase storage. Check your connection and credentials.';
      return results;
    }

    const audioBucket = buckets.find(bucket => bucket.name === 'audio-files');
    
    if (!audioBucket) {
      results.steps.push({ step: 1, status: 'error', message: 'audio-files bucket does not exist' });
      results.message = 'The audio-files bucket needs to be created in your Supabase dashboard.';
      
      console.log('❌ audio-files bucket not found');
      console.log('📝 To fix this:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Storage');
      console.log('   3. Click "Create bucket"');
      console.log('   4. Name it "audio-files"');
      console.log('   5. Make it public');
      
      return results;
    }

    results.steps.push({ step: 1, status: 'success', message: 'audio-files bucket exists' });
    console.log('✅ audio-files bucket found');

    // Step 2: Test upload permissions
    console.log('📋 Step 2: Testing upload permissions...');
    
    const testData = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // Simple test data
    const testFile = new File([testData], 'test.wav', { type: 'audio/wav' });
    const testPath = `test-${Date.now()}.wav`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(testPath, testFile);

    if (uploadError) {
      results.steps.push({ step: 2, status: 'error', message: `Upload failed: ${uploadError.message}` });
      
      if (uploadError.message.includes('row-level security')) {
        results.message = 'Upload permissions not configured. RLS policies need to be set up.';
        console.log('❌ Upload failed - RLS policy issue');
        console.log('📝 To fix this, run these SQL commands in your Supabase SQL editor:');
        console.log(`
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');
        `);
      } else {
        results.message = `Upload failed: ${uploadError.message}`;
        console.log(`❌ Upload failed: ${uploadError.message}`);
      }
      
      return results;
    }

    results.steps.push({ step: 2, status: 'success', message: 'Upload test successful' });
    console.log('✅ Upload test successful');

    // Step 3: Test public access
    console.log('📋 Step 3: Testing public access...');
    
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(testPath);

    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      
      if (response.ok) {
        results.steps.push({ step: 3, status: 'success', message: 'Public access working' });
        console.log('✅ Public access working');
        
        results.success = true;
        results.message = 'Audio storage is configured correctly! Try uploading audio again.';
      } else {
        results.steps.push({ step: 3, status: 'error', message: `Public access failed: HTTP ${response.status}` });
        results.message = 'Files upload but are not publicly accessible. Check bucket public settings.';
        console.log(`❌ Public access failed: HTTP ${response.status}`);
        console.log('📝 To fix this:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to Storage > audio-files');
        console.log('   3. Make sure the bucket is set to public');
      }
    } catch (fetchError) {
      results.steps.push({ step: 3, status: 'error', message: `Access test failed: ${fetchError.message}` });
      results.message = 'Cannot test public access. Network or configuration issue.';
      console.log(`❌ Access test failed: ${fetchError.message}`);
    }

    // Clean up test file
    try {
      await supabase.storage.from('audio-files').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up test file:', cleanupError.message);
    }

  } catch (error) {
    results.steps.push({ step: 'unknown', status: 'error', message: error.message });
    results.message = `Diagnostic failed: ${error.message}`;
    console.error('❌ Diagnostic failed:', error);
  }

  console.log('🏁 Quick fix completed');
  console.log('📊 Results:', results);
  
  return results;
};

// Make it available globally for console use
if (typeof window !== 'undefined') {
  window.quickAudioStorageFix = quickAudioStorageFix;
}

export default quickAudioStorageFix;