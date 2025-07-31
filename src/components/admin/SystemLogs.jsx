import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  Info,
  Bug,
  Database,
  Globe,
  User,
  Shield,
  Clock,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Server,
  Zap,
  Navigation,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import loggingService from '@/services/LoggingService';

const LOG_LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'API', 'DATABASE', 'SESSION', 'AUTH', 'SYSTEM', 'NAVIGATION'];

const LOG_LEVEL_COLORS = {
  ERROR: 'destructive',
  WARN: 'warning',
  INFO: 'default',
  DEBUG: 'secondary',
  API: 'outline',
  DATABASE: 'default',
  SESSION: 'secondary',
  AUTH: 'default',
  SYSTEM: 'outline',
  NAVIGATION: 'secondary'
};

const LOG_LEVEL_ICONS = {
  ERROR: AlertTriangle,
  WARN: AlertTriangle,
  INFO: Info,
  DEBUG: Bug,
  API: Globe,
  DATABASE: Database,
  SESSION: User,
  AUTH: Shield,
  SYSTEM: Server,
  NAVIGATION: Navigation
};

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(50);
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  // Load logs and stats
  const loadLogs = () => {
    const allLogs = loggingService.getLogs();
    const stats = loggingService.getSystemStats();
    
    setLogs(allLogs);
    setSystemStats(stats);
  };

  // Auto-refresh effect
  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.details).toLowerCase().includes(query)
      );
    }

    // Time filter
    if (timeFilter !== 'ALL') {
      const now = new Date();
      let cutoff;
      
      switch (timeFilter) {
        case '1H':
          cutoff = new Date(now - 60 * 60 * 1000);
          break;
        case '6H':
          cutoff = new Date(now - 6 * 60 * 60 * 1000);
          break;
        case '24H':
          cutoff = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7D':
          cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = null;
      }
      
      if (cutoff) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff);
      }
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, levelFilter, searchQuery, timeFilter]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const toggleLogExpansion = (logId) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const handleExportLogs = (format) => {
    const data = loggingService.exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      loggingService.clearLogs();
      loadLogs();
    }
  };

  const getLogIcon = (level) => {
    const IconComponent = LOG_LEVEL_ICONS[level] || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatLogDetails = (details) => {
    if (!details || typeof details !== 'object') return '';
    
    const { sessionId, url, userAgent, ...relevantDetails } = details;
    return Object.entries(relevantDetails)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(' | ');
  };

  return (
    <div className="space-y-6">
      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Uptime</p>
                <h3 className="text-2xl font-bold mt-1">{systemStats.uptime || '0s'}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <h3 className="text-2xl font-bold mt-1">{systemStats.totalLogs || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recent Errors</p>
                <h3 className="text-2xl font-bold mt-1">{systemStats.recentErrors || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                <h3 className="text-2xl font-bold mt-1">
                  {systemStats.memoryUsage ? `${systemStats.memoryUsage.used}MB` : 'N/A'}
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Logs
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {paginatedLogs.length} of {filteredLogs.length} logs
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/audio-diagnostic', '_blank')}
                className="text-blue-600 hover:text-blue-700"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Audio Diagnostic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportLogs('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportLogs('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {LOG_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="1H">Last Hour</SelectItem>
                <SelectItem value="6H">Last 6 Hours</SelectItem>
                <SelectItem value="24H">Last 24 Hours</SelectItem>
                <SelectItem value="7D">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Time</TableHead>
                  <TableHead className="w-24">Level</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-xs">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={LOG_LEVEL_COLORS[log.level] || 'default'}
                            className="flex items-center gap-1 text-xs"
                          >
                            {getLogIcon(log.level)}
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.message}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-96 truncate">
                          {formatLogDetails(log.details)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLogClick(log)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLogExpansion(log.id)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedLogs.has(log.id) ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedLogs.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30">
                            <div className="p-4 space-y-2">
                              <div className="text-sm">
                                <strong>Full Timestamp:</strong> {log.timestamp}
                              </div>
                              <div className="text-sm">
                                <strong>Session ID:</strong> {log.details.sessionId}
                              </div>
                              {log.details.url && (
                                <div className="text-sm">
                                  <strong>URL:</strong> {log.details.url}
                                </div>
                              )}
                              <div className="text-sm">
                                <strong>Details:</strong>
                                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {logs.length === 0 ? 'No logs available' : 'No logs match your filters'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLogIcon(selectedLog.level)}
              Log Details
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.timestamp), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                <div>
                  <strong>Level:</strong>
                  <Badge variant={LOG_LEVEL_COLORS[selectedLog.level]} className="ml-2">
                    {selectedLog.level}
                  </Badge>
                </div>
                <div>
                  <strong>Message:</strong>
                  <p className="mt-1 font-mono">{selectedLog.message}</p>
                </div>
                <div>
                  <strong>Details:</strong>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}