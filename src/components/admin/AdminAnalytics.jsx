import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Search,
  Radio,
  Mic,
  Activity,
  MapPin,
  Clock,
  Target,
  Zap,
  Loader
} from "lucide-react";
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format, subDays, isAfter } from "date-fns";

export default function AdminAnalytics({ tours, users, assignments, userActivity, onRefresh }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [broadcastStats, setBroadcastStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalDuration: 0,
    driversReached: 0
  });
  
  // Add a top-level guard to prevent rendering with null data
  if (!tours || !users || !assignments) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Calculating latest metrics...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Loader className="mx-auto h-8 w-8 animate-spin" />
            <p className="mt-4">Loading analytics data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize tours data to prevent re-computation on every render
  const safeTours = useMemo(() => tours || [], [tours]);
  const safeUsers = useMemo(() => users || [], [users]);
  const safeAssignments = useMemo(() => assignments || [], [assignments]);

  // Financial calculations
  const toursWithFinancials = useMemo(() => {
    return safeTours.map(tour => {
      const tourAssignments = safeAssignments.filter(a => a.tour_id === tour.id);
      const touristCount = tourAssignments.reduce((acc, curr) => acc + (curr.group_size || 0), 0);
      
      const revenue = touristCount * (tour.financials?.price_per_tourist || 0);
      const costs = {
        driver: tour.financials?.costs?.driver_fee || 0,
        fuel: tour.financials?.costs?.fuel_cost || 0,
        food: touristCount * (tour.financials?.costs?.food_cost_per_tourist || 0),
        other: tour.financials?.costs?.other_costs || 0
      };
      
      const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
      const profit = revenue - totalCosts;
      
      return {
        ...tour,
        touristCount,
        revenue,
        costs,
        totalCosts,
        profit,
        assignments: tourAssignments
      };
    });
  }, [safeTours, safeAssignments]);

  // Filter tours by time range
  const filteredTours = useMemo(() => {
    if (timeRange === "all") return toursWithFinancials;
    
    const cutoffDate = timeRange === "today" ? subDays(new Date(), 1) :
                     timeRange === "week" ? subDays(new Date(), 7) :
                     timeRange === "month" ? subDays(new Date(), 30) :
                     timeRange === "year" ? subDays(new Date(), 365) :
                     new Date(0);

    return toursWithFinancials.filter(tour => {
      const tourDate = tour.created_date || tour.created_at;
      return tourDate && !isNaN(new Date(tourDate).getTime()) && isAfter(new Date(tourDate), cutoffDate);
    });
  }, [toursWithFinancials, timeRange]);

  // Calculate KPIs
  const totalRevenue = filteredTours.reduce((sum, tour) => sum + tour.revenue, 0);
  const totalCosts = filteredTours.reduce((sum, tour) => sum + tour.totalCosts, 0);
  const totalProfit = filteredTours.reduce((sum, tour) => sum + tour.profit, 0);
  const totalTourists = filteredTours.reduce((sum, tour) => sum + tour.touristCount, 0);

  // Activity metrics
  const activeUsers = safeUsers.filter(user => 
    user.last_active_date && 
    isAfter(new Date(user.last_active_date), subDays(new Date(), 7))
  ).length;

  const completedTours = safeAssignments.filter(a => a.status === 'completed').length;
  const averageRating = 4.2; // Placeholder - would calculate from reviews

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    const months = {};
    filteredTours.forEach(tour => {
      // Validate date before formatting
      const tourDate = tour.created_date || tour.created_at;
      if (tourDate && !isNaN(new Date(tourDate).getTime())) {
        const monthKey = format(new Date(tourDate), 'MMM yyyy');
        months[monthKey] = (months[monthKey] || 0) + tour.revenue;
      }
    });
    
    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
      profit: revenue * 0.3 // Simplified profit calculation
    }));
  }, [filteredTours]);

  // Cost breakdown data
  const costBreakdown = useMemo(() => [
    { name: 'Driver Fees', value: filteredTours.reduce((sum, tour) => sum + (tour.costs?.driver || 0), 0), color: '#3b82f6' },
    { name: 'Fuel', value: filteredTours.reduce((sum, tour) => sum + (tour.costs?.fuel || 0), 0), color: '#22c55e' },
    { name: 'Food', value: filteredTours.reduce((sum, tour) => sum + (tour.costs?.food || 0), 0), color: '#eab308' },
    { name: 'Other', value: filteredTours.reduce((sum, tour) => sum + (tour.costs?.other || 0), 0), color: '#ef4444' }
  ].filter(item => item.value > 0), [filteredTours]);

  // User engagement data
  const engagementData = useMemo(() => [
    { name: 'New Users', value: safeUsers.filter(u => {
      const userDate = u.created_date || u.created_at;
      return userDate && !isNaN(new Date(userDate).getTime()) && isAfter(new Date(userDate), subDays(new Date(), 30));
    }).length },
    { name: 'Active Users', value: activeUsers },
    { name: 'Tours Created', value: filteredTours.length },
    { name: 'Tours Completed', value: completedTours }
  ], [safeUsers, activeUsers, filteredTours, completedTours]);

  // Load live broadcast statistics
  useEffect(() => {
    // Simulate broadcast statistics - in real app, this would come from the database
    setBroadcastStats({
      totalSessions: Math.floor(Math.random() * 50) + 10,
      activeSessions: Math.floor(Math.random() * 5),
      totalDuration: Math.floor(Math.random() * 120) + 30, // minutes
      driversReached: Math.floor(Math.random() * 20) + 5
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefresh}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="broadcasts">Live Broadcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">${totalRevenue.toFixed(2)}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <h3 className="text-2xl font-bold mt-1">{activeUsers}</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+8.2%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed Tours</p>
                    <h3 className="text-2xl font-bold mt-1">{completedTours}</h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <Target className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-blue-600">{((completedTours / Math.max(safeAssignments.length, 1)) * 100).toFixed(1)}%</span>
                  <span className="text-gray-500 ml-1">completion rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. Rating</p>
                    <h3 className="text-2xl font-bold mt-1">{averageRating}</h3>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-yellow-600">★★★★☆</span>
                  <span className="text-gray-500 ml-1">from {totalTourists} tourists</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and profit overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="profit" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Key engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Profit</p>
                    <h3 className="text-2xl font-bold mt-1">${totalProfit.toFixed(2)}</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Costs</p>
                    <h3 className="text-2xl font-bold mt-1">${totalCosts.toFixed(2)}</h3>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                    <h3 className="text-2xl font-bold mt-1">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. per Tourist</p>
                    <h3 className="text-2xl font-bold mt-1">${totalTourists > 0 ? (totalRevenue / totalTourists).toFixed(2) : 0}</h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Distribution of operational costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tour Profitability</CardTitle>
                <CardDescription>Revenue vs costs by tour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredTours.slice(0, 10).map(tour => ({
                      name: tour.title.substring(0, 15) + '...',
                      revenue: tour.revenue,
                      costs: tour.totalCosts,
                      profit: tour.profit
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" />
                      <Bar dataKey="costs" fill="#ef4444" />
                      <Bar dataKey="profit" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tour Financial Details</CardTitle>
              <CardDescription>Detailed breakdown of tour finances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search tours..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tour</TableHead>
                    <TableHead>Tourists</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Costs</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTours
                    .filter(tour => 
                      tour.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((tour) => (
                      <TableRow key={tour.id}>
                        <TableCell>
                          <div className="font-medium">{tour.title}</div>
                          <div className="text-sm text-gray-500">{tour.location?.city}</div>
                        </TableCell>
                        <TableCell>{tour.touristCount}</TableCell>
                        <TableCell>${tour.revenue.toFixed(2)}</TableCell>
                        <TableCell>${tour.totalCosts.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${tour.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${tour.profit.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tour.profit >= 0 ? "default" : "destructive"}>
                            {tour.revenue > 0 ? ((tour.profit / tour.revenue) * 100).toFixed(1) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Over Time</CardTitle>
              <CardDescription>Daily active users and tour completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.from({ length: 30 }, (_, i) => ({
                    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
                    activeUsers: Math.floor(Math.random() * 50) + 20,
                    completions: Math.floor(Math.random() * 10) + 2
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="completions" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Segments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Tourist', 'Driver', 'Tour Guide', 'Admin'].map(group => {
                    const count = safeUsers.filter(u => (u.user_group || []).includes(group)).length;
                    const percentage = safeUsers.length > 0 ? (count / safeUsers.length) * 100 : 0;
                    return (
                      <div key={group} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{group}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{count}</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tour Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['cultural', 'historical', 'nature', 'culinary'].map(theme => {
                    const count = safeTours.filter(t => t.theme === theme).length;
                    const percentage = safeTours.length > 0 ? (count / safeTours.length) * 100 : 0;
                    return (
                      <div key={theme} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{theme}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{count}</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tour Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'completed', color: 'bg-green-500' },
                    { status: 'in_progress', color: 'bg-blue-500' },
                    { status: 'assigned', color: 'bg-yellow-500' },
                    { status: 'cancelled', color: 'bg-red-500' }
                  ].map(({ status, color }) => {
                    const count = safeAssignments.filter(a => a.status === status).length;
                    const percentage = safeAssignments.length > 0 ? (count / safeAssignments.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{count}</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className={`h-2 ${color} rounded-full`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          {/* Live Broadcast KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                    <h3 className="text-2xl font-bold mt-1">{broadcastStats.totalSessions}</h3>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Radio className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                    <h3 className="text-2xl font-bold mt-1">{broadcastStats.activeSessions}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mic className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={broadcastStats.activeSessions > 0 ? "default" : "secondary"}>
                    {broadcastStats.activeSessions > 0 ? "Live Now" : "Offline"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Duration</p>
                    <h3 className="text-2xl font-bold mt-1">{broadcastStats.totalDuration}m</h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Drivers Reached</p>
                    <h3 className="text-2xl font-bold mt-1">{broadcastStats.driversReached}</h3>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Broadcast Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Broadcast Activity</CardTitle>
              <CardDescription>Live audio communications sent to drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Radio className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Broadcast to Driver #{Math.floor(Math.random() * 100)}</div>
                        <div className="text-sm text-gray-500">
                          {format(subDays(new Date(), Math.floor(Math.random() * 7)), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {Math.floor(Math.random() * 60)}s
                      </Badge>
                      <Badge variant={Math.random() > 0.5 ? "default" : "secondary"}>
                        {Math.random() > 0.5 ? "Delivered" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Broadcast Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Usage Over Time</CardTitle>
              <CardDescription>Daily broadcast sessions and duration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 14 }, (_, i) => ({
                    date: format(subDays(new Date(), 13 - i), 'MMM dd'),
                    sessions: Math.floor(Math.random() * 8) + 1,
                    duration: Math.floor(Math.random() * 30) + 5
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="sessions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="duration" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}