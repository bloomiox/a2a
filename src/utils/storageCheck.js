// Storage Configuration Checker
// This utility helps diagnose Supabase storage issues

import { supabase } from '@/api/supabaseClient';

export const checkStorageConfiguration = async () => {
  const results = {
    buckets: {},
    errors: [],
    recommendations: []
  };

  try {
    // Check if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      results.errors.push(`Cannot list buckets: ${bucketsError.message}`);
      return results;
    }

    console.log('Available buckets:', buckets);

    // Check specific buckets we need
    const requiredBuckets = ['audio-files', 'tour-images'];
    
    for (const bucketName of requiredBuckets) {
      const bucket = buckets.find(b => b.name === bucketName);
      
      if (!bucket) {
        results.errors.push(`Missing bucket: ${bucketName}`);
        results.recommendations.push(`Create bucket '${bucketName}' in Supabase dashboard`);
        continue;
      }

      results.buckets[bucketName] = {
        exists: true,
        public: bucket.public,
        created_at: bucket.created_at
      };

      // Test upload to bucket
      try {
        const testFile = new Blob(['test'], { type: 'text/plain' });
        const testFileName = `test-${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(testFileName, testFile);

        if (uploadError) {
          results.errors.push(`Cannot upload to ${bucketName}: ${uploadError.message}`);
          if (uploadError.message.includes('row-level security')) {
            results.recommendations.push(`Configure RLS policies for bucket '${bucketName}' to allow authenticated users to upload`);
          }
        } else {
          // Test public URL access
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(testFileName);

          try {
            const response = await fetch(publicUrl, { method: 'HEAD' });
            results.buckets[bucketName].publicAccess = response.ok;
            
            if (!response.ok) {
              results.errors.push(`Public access failed for ${bucketName}: ${response.status}`);
              results.recommendations.push(`Make bucket '${bucketName}' public or configure proper access policies`);
            }
          } catch (fetchError) {
            results.errors.push(`Cannot test public access for ${bucketName}: ${fetchError.message}`);
          }

          // Clean up test file
          await supabase.storage.from(bucketName).remove([testFileName]);
        }
      } catch (testError) {
        results.errors.push(`Test upload failed for ${bucketName}: ${testError.message}`);
      }
    }

  } catch (error) {
    results.errors.push(`Storage check failed: ${error.message}`);
  }

  return results;
};

export const getStorageRecommendations = (checkResults) => {
  const recommendations = [...checkResults.recommendations];

  if (checkResults.errors.length > 0) {
    recommendations.push("Check Supabase dashboard for storage configuration");
    recommendations.push("Ensure storage buckets exist and have proper policies");
    recommendations.push("Verify authentication is working correctly");
  }

  return recommendations;
};