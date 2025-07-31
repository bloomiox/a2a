// Test existing audio files to confirm the access issue
import { supabase } from '@/api/supabaseClient';

export const testExistingAudioFiles = async () => {
  console.log('🎵 Testing existing audio files...');
  
  const results = {
    files: [],
    summary: {
      total: 0,
      accessible: 0,
      blocked: 0,
      errors: 0
    }
  };

  try {
    // Get list of files in audio-files bucket
    const { data: files, error: listError } = await supabase.storage
      .from('audio-files')
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ Cannot list files:', listError.message);
      return {
        error: `Cannot list files: ${listError.message}`,
        suggestion: 'This indicates RLS policies are blocking even basic bucket access'
      };
    }

    console.log(`📁 Found ${files.length} files in bucket`);
    results.summary.total = files.length;

    // Test access to each file
    for (const file of files) {
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(file.name);

      const fileResult = {
        name: file.name,
        size: file.metadata?.size || 'unknown',
        url: publicUrl,
        accessible: false,
        status: 'unknown',
        error: null
      };

      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        fileResult.status = response.status;
        fileResult.accessible = response.ok;

        if (response.ok) {
          results.summary.accessible++;
          console.log(`✅ ${file.name} - accessible`);
        } else {
          results.summary.blocked++;
          console.log(`❌ ${file.name} - blocked (HTTP ${response.status})`);
        }
      } catch (error) {
        fileResult.error = error.message;
        results.summary.errors++;
        console.log(`🔥 ${file.name} - error: ${error.message}`);
      }

      results.files.push(fileResult);
    }

    // Generate summary
    console.log('📊 Summary:');
    console.log(`   Total files: ${results.summary.total}`);
    console.log(`   Accessible: ${results.summary.accessible}`);
    console.log(`   Blocked: ${results.summary.blocked}`);
    console.log(`   Errors: ${results.summary.errors}`);

    // Provide recommendations
    if (results.summary.blocked > 0 || results.summary.errors > 0) {
      console.log('🔧 Recommendation: Run the SQL policies to fix access');
      console.log('   See: sql/fix_audio_bucket_policies.sql');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    results.error = error.message;
  }

  return results;
};

// Test a specific audio URL pattern from your error message
export const testSpecificAudioUrl = async () => {
  // Based on your error message URL pattern
  const baseUrl = 'https://ynreicljcvcpzckhojtx.supabase.co/storage/v1/object/public/audio-files/';
  
  // Test with some of the files we can see in your screenshot
  const testFiles = [
    '29coo3oebgw.wav',
    '3sf8as64vgy.mp3',
    '3vyO7eh63yw.wav'
  ];

  console.log('🎯 Testing specific audio URLs...');
  
  for (const fileName of testFiles) {
    const fullUrl = baseUrl + fileName;
    console.log(`Testing: ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, { method: 'HEAD' });
      console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (!response.ok) {
        console.log(`   This confirms the RLS policy issue`);
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.testExistingAudioFiles = testExistingAudioFiles;
  window.testSpecificAudioUrl = testSpecificAudioUrl;
}

export { testExistingAudioFiles, testSpecificAudioUrl };