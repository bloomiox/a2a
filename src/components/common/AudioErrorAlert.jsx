import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Stethoscope, ExternalLink } from 'lucide-react';

export default function AudioErrorAlert({ 
  error, 
  onRetry, 
  onDismiss,
  showDiagnostic = true 
}) {
  const handleDiagnostic = () => {
    window.open('/audio-diagnostic', '_blank');
  };

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Audio upload or playback failed';
  };

  const getErrorDetails = (error) => {
    const message = getErrorMessage(error);
    
    if (message.includes('Bucket not found')) {
      return 'The audio storage bucket is not configured. Please check your Supabase storage setup.';
    }
    
    if (message.includes('permission denied') || message.includes('403')) {
      return 'Upload permissions are not configured. Please check your storage bucket policies.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('not accessible') || message.includes('404')) {
      return 'The audio file may not have been uploaded properly or is not accessible.';
    }
    
    return 'There was an issue with audio storage. This is usually a configuration problem.';
  };

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-red-800">Audio Error</div>
            <div className="text-sm text-red-700 mt-1">
              {getErrorDetails(error)}
            </div>
          </div>
          
          <div className="text-xs text-red-600 bg-white p-2 rounded border">
            <div className="font-medium mb-1">Quick troubleshooting:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Check if audio was uploaded during tour creation</li>
              <li>Verify the audio file format is supported (MP3, WAV, OGG)</li>
              <li>Ensure Supabase storage is properly configured</li>
            </ul>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
            
            {showDiagnostic && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiagnostic}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Stethoscope className="h-3 w-3 mr-1" />
                Run Diagnostic
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 border-t pt-2">
            <strong>Technical details:</strong> {getErrorMessage(error)}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}