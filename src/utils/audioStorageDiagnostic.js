// Audio Storage Diagnostic Tool
// This utility diagnoses and helps fix Supabase storage issues for audio files

import { supabase } from '@/api/supabaseClient';
import { UploadFile } from '@/api/integrations';

export class AudioStorageDiagnostic {
  constructor() {
    this.results = {
      checks: [],
      errors: [],
      warnings: [],
      recommendations: [],
      status: 'unknown'
    };
  }

  async runFullDiagnostic() {
    console.log('🔍 Starting Audio Storage Diagnostic...');
    
    try {
      await this.checkSupabaseConnection();
      await this.checkBucketExists();
      await this.checkBucketPolicies();
      await this.testFileUpload();
      await this.testPublicAccess();
      
      this.generateRecommendations();
      this.determineOverallStatus();
      
    } catch (error) {
      this.addError('Diagnostic failed', error.message);
      this.results.status = 'failed';
    }

    return this.results;
  }

  async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addError('Supabase Connection', `Authentication error: ${error.message}`);
        return false;
      }

      this.addCheck('Supabase Connection', 'Connected successfully', 'success');
      return true;
    } catch (error) {
      this.addError('Supabase Connection', `Connection failed: ${error.message}`);
      return false;
    }
  }

  async checkBucketExists() {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        this.addError('Bucket Check', `Cannot list buckets: ${error.message}`);
        return false;
      }

      const audioBucket = buckets.find(bucket => bucket.name === 'audio-files');
      
      if (!audioBucket) {
        this.addError('Bucket Check', 'audio-files bucket does not exist');
        this.addRecommendation('Create the audio-files bucket in your Supabase dashboard');
        return false;
      }

      this.addCheck('Bucket Check', `audio-files bucket exists (created: ${audioBucket.created_at})`, 'success');
      
      if (audioBucket.public) {
        this.addCheck('Bucket Visibility', 'Bucket is public', 'success');
      } else {
        this.addWarning('Bucket Visibility', 'Bucket is private - may need public access for audio playback');
      }

      return true;
    } catch (error) {
      this.addError('Bucket Check', `Bucket check failed: ${error.message}`);
      return false;
    }
  }

  async checkBucketPolicies() {
    try {
      // Try to list files in the bucket to test read permissions
      const { data, error } = await supabase.storage
        .from('audio-files')
        .list('', { limit: 1 });

      if (error) {
        if (error.message.includes('row-level security')) {
          this.addError('Bucket Policies', 'RLS policies prevent access to audio-files bucket');
          this.addRecommendation('Configure RLS policies to allow authenticated users to access audio-files bucket');
        } else {
          this.addError('Bucket Policies', `Cannot access bucket: ${error.message}`);
        }
        return false;
      }

      this.addCheck('Bucket Policies', 'Can access bucket contents', 'success');
      return true;
    } catch (error) {
      this.addError('Bucket Policies', `Policy check failed: ${error.message}`);
      return false;
    }
  }

  async testFileUpload() {
    try {
      // Create a test audio file
      const testAudioData = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45
      ]); // Minimal WAV header
      
      const testFile = new File([testAudioData], 'test-audio.wav', { 
        type: 'audio/wav' 
      });

      const result = await UploadFile(testFile, { bucket: 'audio-files' });

      if (!result.success) {
        this.addError('File Upload', `Upload failed: ${result.error}`);
        
        if (result.error.includes('Bucket not found')) {
          this.addRecommendation('Create the audio-files bucket in Supabase dashboard');
        } else if (result.error.includes('permission denied') || result.error.includes('403')) {
          this.addRecommendation('Configure upload policies for audio-files bucket');
        }
        
        return false;
      }

      this.addCheck('File Upload', `Test file uploaded successfully to: ${result.path}`, 'success');
      
      // Store the test file URL for cleanup
      this.testFileUrl = result.url;
      this.testFilePath = result.path;
      
      return true;
    } catch (error) {
      this.addError('File Upload', `Upload test failed: ${error.message}`);
      return false;
    }
  }

  async testPublicAccess() {
    if (!this.testFileUrl) {
      this.addWarning('Public Access', 'Skipped - no test file uploaded');
      return false;
    }

    try {
      const response = await fetch(this.testFileUrl, { method: 'HEAD' });
      
      if (response.ok) {
        this.addCheck('Public Access', 'Test file is publicly accessible', 'success');
        
        // Clean up test file
        await this.cleanupTestFile();
        
        return true;
      } else {
        this.addError('Public Access', `Test file not accessible (HTTP ${response.status})`);
        this.addRecommendation('Make audio-files bucket public or configure proper access policies');
        return false;
      }
    } catch (error) {
      this.addError('Public Access', `Access test failed: ${error.message}`);
      return false;
    }
  }

  async cleanupTestFile() {
    if (this.testFilePath) {
      try {
        await supabase.storage
          .from('audio-files')
          .remove([this.testFilePath]);
        
        console.log('✅ Test file cleaned up');
      } catch (error) {
        console.warn('⚠️ Could not clean up test file:', error.message);
      }
    }
  }

  generateRecommendations() {
    const hasErrors = this.results.errors.length > 0;
    
    if (hasErrors) {
      this.addRecommendation('Follow the Supabase Storage Setup Guide below');
      this.addRecommendation('Check your Supabase dashboard for storage configuration');
      this.addRecommendation('Ensure you have the correct permissions in your Supabase project');
    } else {
      this.addRecommendation('Storage configuration looks good! Try uploading audio again.');
    }
  }

  determineOverallStatus() {
    if (this.results.errors.length === 0) {
      this.results.status = 'healthy';
    } else if (this.results.errors.length <= 2) {
      this.results.status = 'needs_attention';
    } else {
      this.results.status = 'critical';
    }
  }

  addCheck(category, message, status) {
    this.results.checks.push({ category, message, status });
    console.log(`✅ ${category}: ${message}`);
  }

  addError(category, message) {
    this.results.errors.push({ category, message });
    console.error(`❌ ${category}: ${message}`);
  }

  addWarning(category, message) {
    this.results.warnings.push({ category, message });
    console.warn(`⚠️ ${category}: ${message}`);
  }

  addRecommendation(message) {
    this.results.recommendations.push(message);
  }

  generateReport() {
    const report = {
      summary: this.getSummary(),
      details: this.results,
      setupGuide: this.getSetupGuide()
    };

    return report;
  }

  getSummary() {
    const totalChecks = this.results.checks.length;
    const successfulChecks = this.results.checks.filter(c => c.status === 'success').length;
    const errorCount = this.results.errors.length;
    const warningCount = this.results.warnings.length;

    return {
      status: this.results.status,
      totalChecks,
      successfulChecks,
      errorCount,
      warningCount,
      message: this.getSummaryMessage()
    };
  }

  getSummaryMessage() {
    switch (this.results.status) {
      case 'healthy':
        return 'Audio storage is configured correctly and working properly.';
      case 'needs_attention':
        return 'Audio storage has some issues that need to be addressed.';
      case 'critical':
        return 'Audio storage has critical issues that prevent proper functionality.';
      default:
        return 'Audio storage status could not be determined.';
    }
  }

  getSetupGuide() {
    return {
      title: 'Supabase Audio Storage Setup Guide',
      steps: [
        {
          step: 1,
          title: 'Create Storage Bucket',
          description: 'Create the audio-files bucket in your Supabase dashboard',
          instructions: [
            'Go to your Supabase dashboard',
            'Navigate to Storage section',
            'Click "Create bucket"',
            'Name it "audio-files"',
            'Make it public if you want direct audio access'
          ]
        },
        {
          step: 2,
          title: 'Configure Bucket Policies',
          description: 'Set up RLS policies for the audio-files bucket',
          instructions: [
            'Go to Storage > audio-files bucket',
            'Click on "Policies" tab',
            'Add policy for INSERT: Allow authenticated users to upload',
            'Add policy for SELECT: Allow public or authenticated access',
            'Example INSERT policy: authenticated users can upload to their own folders'
          ]
        },
        {
          step: 3,
          title: 'Test Configuration',
          description: 'Verify the setup works correctly',
          instructions: [
            'Run this diagnostic tool again',
            'Try uploading an audio file in the tour creator',
            'Check that the audio file plays correctly',
            'Verify the URL is accessible'
          ]
        }
      ],
      sqlPolicies: this.getSQLPolicies()
    };
  }

  getSQLPolicies() {
    return {
      description: 'SQL policies you can run in your Supabase SQL editor',
      policies: [
        {
          name: 'Allow authenticated uploads to audio-files',
          sql: `
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files');`
        },
        {
          name: 'Allow public access to audio-files',
          sql: `
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'audio-files');`
        }
      ]
    };
  }
}

// Convenience function to run diagnostic
export const runAudioStorageDiagnostic = async () => {
  const diagnostic = new AudioStorageDiagnostic();
  await diagnostic.runFullDiagnostic();
  return diagnostic.generateReport();
};

export default AudioStorageDiagnostic;