import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Car, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import advancedFeaturesTest from '@/utils/testAdvancedFeatures';
import migrationRunner from '@/utils/migrationRunner';
import offlineManager from '@/services/OfflineManager';
import driverPerformanceService from '@/services/DriverPerformanceService';

const AdvancedFeaturesPanel = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const [healthCheck, setHealthCheck] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load migration status
      const migrations = await migrationRunner.checkMigrationsNeeded();
      setMigrationStatus(migrations);

      // Load storage stats
      const storage = await offlineManager.getStorageStats();
      setStorageStats(storage);

      // Run quick health check
      const health = await advancedFeaturesTest.quickHealthCheck();
      setHealthCheck(health);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const runFullTests = async () => {
    setIsRunningTests(true);
    
    try {
      const results = await advancedFeaturesTest.runAllTests();
      setTestResults(results);
      
      toast({
        title: "Tests Completed",
        description: "Advanced features test suite has completed.",
      });

      // Refresh data after tests
      await loadInitialData();
    } catch (error) {
      console.error('Test suite failed:', error);
      toast({
        title: "Tests Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const runMigrations = async () => {
    try {
      await migrationRunner.runMigrations();
      
      toast({
        title: "Migrations Complete",
        description: "Database migrations have been applied successfully.",
      });

      // Refresh migration status
      const migrations = await migrationRunner.checkMigrationsNeeded();
      setMigrationStatus(migrations);
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearOfflineStorage = async () => {
    try {
      await offlineManager.cleanupOldData(0); // Clean all data
      
      toast({
        title: "Storage Cleared",
        description: "Offline storage has been cleared.",
      });

      // Refresh storage stats
      const storage = await offlineManager.getStorageStats();
      setStorageStats(storage);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Features Management</h2>
          <p className="text-muted-foreground">
            Manage and test advanced features including offline mode, driver experience, and multi-tenant architecture.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadInitialData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={runFullTests} 
            disabled={isRunningTests}
            size="sm"
          >
            {isRunningTests ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Health Check Overview */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Health Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {healthCheck.healthy ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {healthCheck.healthy ? 'All Systems Operational' : 'Issues Detected'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last checked: {new Date(healthCheck.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            {!healthCheck.healthy && healthCheck.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {healthCheck.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="offline">Offline Mode</TabsTrigger>
          <TabsTrigger value="driver">Driver Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Test Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([feature, result]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                        {getStatusIcon(result.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No test results yet. Click "Run Tests" to start.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Migration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database Status</CardTitle>
              </CardHeader>
              <CardContent>
                {migrationStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Migrations Needed</span>
                      <Badge variant={migrationStatus.needed ? "destructive" : "default"}>
                        {migrationStatus.needed ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm font-medium">{migrationStatus.completed.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm font-medium">{migrationStatus.pending.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading migration status...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {storageStats ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Used</span>
                      <span>{storageStats.used}MB</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Available</span>
                      <span>{storageStats.available}MB</span>
                    </div>
                    <Progress value={storageStats.percentage} className="w-full" />
                    <div className="text-xs text-center text-muted-foreground">
                      {storageStats.percentage.toFixed(1)}% used
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading storage stats...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="migrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Migrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {migrationStatus && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Migration Status</span>
                    <Badge variant={migrationStatus.needed ? "destructive" : "default"}>
                      {migrationStatus.needed ? 'Migrations Needed' : 'Up to Date'}
                    </Badge>
                  </div>

                  {migrationStatus.pending.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Pending Migrations:</h4>
                      <div className="space-y-1">
                        {migrationStatus.pending.map((migration) => (
                          <div key={migration.id} className="text-sm bg-yellow-50 p-2 rounded">
                            <div className="font-medium">{migration.name}</div>
                            <div className="text-xs text-muted-foreground">{migration.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {migrationStatus.completed.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Completed Migrations:</h4>
                      <div className="text-sm text-muted-foreground">
                        {migrationStatus.completed.length} migrations completed
                      </div>
                    </div>
                  )}

                  {migrationStatus.needed && (
                    <Button onClick={runMigrations} className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Run Migrations
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Offline Mode Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageStats && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{storageStats.used}MB</div>
                      <div className="text-sm text-muted-foreground">Used Storage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{storageStats.available}MB</div>
                      <div className="text-sm text-muted-foreground">Available Storage</div>
                    </div>
                  </div>

                  <Progress value={storageStats.percentage} className="w-full" />

                  <div className="flex gap-2">
                    <Button onClick={clearOfflineStorage} variant="outline" className="flex-1">
                      Clear Storage
                    </Button>
                    <Button onClick={loadInitialData} variant="outline" className="flex-1">
                      Refresh Stats
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Driver Experience Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Driver experience features include mobile app, performance tracking, 
                  route optimization, and earnings management.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="font-medium">Mobile App</div>
                    <div className="text-xs text-muted-foreground">Responsive driver interface</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="font-medium">Performance</div>
                    <div className="text-xs text-muted-foreground">Metrics and analytics</div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => window.open('/driver-mobile', '_blank')}>
                  Open Driver Mobile App
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedFeaturesPanel;