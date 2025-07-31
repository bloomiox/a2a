import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  Database,
  Upload,
  Play
} from 'lucide-react';
import { runAudioStorageDiagnostic } from '@/utils/audioStorageDiagnostic';

export default function AudioStorageDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await runAudioStorageDiagnostic();
      setReport(diagnosticReport);
      
      // Show setup guide if there are issues
      if (diagnosticReport.summary.status !== 'healthy') {
        setShowSetupGuide(true);
      }
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setReport({
        summary: {
          status: 'failed',
          message: `Diagnostic failed: ${error.message}`
        },
        details: { errors: [{ category: 'System', message: error.message }] }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'needs_attention':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Audio Storage Diagnostic</h1>
        <p className="text-gray-600">
          Diagnose and fix Supabase storage issues for audio files in your tours.
        </p>
      </div>

      {/* Run Diagnostic Button */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Storage Health Check</h3>
              <p className="text-gray-600">
                Run a comprehensive check of your audio storage configuration.
              </p>
            </div>
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Run Diagnostic'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {report && (
        <>
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(report.summary.status)}
                Diagnostic Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border ${getStatusColor(report.summary.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    Status: {report.summary.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <Badge variant="outline">
                    {report.summary.successfulChecks}/{report.summary.totalChecks} checks passed
                  </Badge>
                </div>
                <p>{report.summary.message}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {report.summary.successfulChecks}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {report.summary.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.summary.warningCount}
                  </div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Successful Checks */}
            {report.details.checks && report.details.checks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Successful Checks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.details.checks.map((check, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{check.category}</div>
                          <div className="text-xs text-gray-600">{check.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errors and Warnings */}
            {(report.details.errors?.length > 0 || report.details.warnings?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Issues Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.details.errors?.map((error, index) => (
                      <Alert key={`error-${index}`} className="border-red-200">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <AlertDescription>
                          <div className="font-medium">{error.category}</div>
                          <div className="text-sm">{error.message}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                    
                    {report.details.warnings?.map((warning, index) => (
                      <Alert key={`warning-${index}`} className="border-yellow-200">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <AlertDescription>
                          <div className="font-medium">{warning.category}</div>
                          <div className="text-sm">{warning.message}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations */}
          {report.details.recommendations && report.details.recommendations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.details.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Setup Guide */}
          {showSetupGuide && report.setupGuide && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  {report.setupGuide.title}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                >
                  {showSetupGuide ? 'Hide' : 'Show'} Setup Guide
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {report.setupGuide.steps.map((step, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold mb-2">
                        Step {step.step}: {step.title}
                      </h4>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <ul className="space-y-1">
                        {step.instructions.map((instruction, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* SQL Policies */}
                  {report.setupGuide.sqlPolicies && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">SQL Policies</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.setupGuide.sqlPolicies.description}
                      </p>
                      {report.setupGuide.sqlPolicies.policies.map((policy, index) => (
                        <div key={index} className="mb-4">
                          <h5 className="font-medium text-sm mb-1">{policy.name}</h5>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {policy.sql.trim()}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <Database className="w-4 h-4" />
              Open Supabase Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/create'}
            >
              <Upload className="w-4 h-4" />
              Test Audio Upload
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/play'}
            >
              <Play className="w-4 h-4" />
              Test Audio Playback
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}