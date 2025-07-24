import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { TourAssignment } from "@/api/entities";
import { useLanguage } from '@/components/i18n/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Search
} from "lucide-react";

export default function Financials() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadFinancialData();
  }, [timeRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const toursData = await Tour.list();
      const assignments = await TourAssignment.list();
      
      const toursWithFinancials = await Promise.all(
        toursData.map(async (tour) => {
          const tourAssignments = assignments.filter(a => a.tour_id === tour.id);
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
        })
      );

      setTours(toursWithFinancials);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = tours.reduce((sum, tour) => sum + tour.revenue, 0);
  const totalCosts = tours.reduce((sum, tour) => sum + tour.totalCosts, 0);
  const totalProfit = tours.reduce((sum, tour) => sum + tour.profit, 0);
  const totalTourists = tours.reduce((sum, tour) => sum + tour.touristCount, 0);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('financials.title')}</h1>
          <p className="text-gray-500">{t('financials.subtitle')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('financials.totalRevenue')}</p>
                <h3 className="text-2xl font-bold mt-1">${totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('financials.totalProfit')}</p>
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
                <p className="text-sm font-medium text-gray-500">{t('financials.totalCosts')}</p>
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
                <p className="text-sm font-medium text-gray-500">{t('financials.totalTourists')}</p>
                <h3 className="text-2xl font-bold mt-1">{totalTourists}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('financials.revenueOverTime')}</CardTitle>
          <CardDescription>{t('financials.revenueDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={tours.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('financials.costBreakdown')}</CardTitle>
          <CardDescription>{t('financials.costBreakdownDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tours.map(tour => ({
                  name: tour.title,
                  driver: tour.costs.driver,
                  fuel: tour.costs.fuel,
                  food: tour.costs.food,
                  other: tour.costs.other
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="driver" stackId="a" fill="#3b82f6" />
                <Bar dataKey="fuel" stackId="a" fill="#22c55e" />
                <Bar dataKey="food" stackId="a" fill="#eab308" />
                <Bar dataKey="other" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Financial Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financials.tourFinancials')}</CardTitle>
          <CardDescription>{t('financials.tourFinancialsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('financials.searchTours')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('financials.selectTimeRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('financials.allTime')}</SelectItem>
                <SelectItem value="today">{t('financials.today')}</SelectItem>
                <SelectItem value="week">{t('financials.thisWeek')}</SelectItem>
                <SelectItem value="month">{t('financials.thisMonth')}</SelectItem>
                <SelectItem value="year">{t('financials.thisYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour</TableHead>
                <TableHead>Tourists</TableHead>
                <TableHead>Price/Tourist</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Costs</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours
                .filter(tour => 
                  tour.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>
                      <div className="font-medium">{tour.title}</div>
                      <div className="text-sm text-gray-500">{tour.location.city}</div>
                    </TableCell>
                    <TableCell>{tour.touristCount}</TableCell>
                    <TableCell>${tour.financials?.price_per_tourist || 0}</TableCell>
                    <TableCell>${tour.revenue}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Driver: ${tour.costs.driver}</div>
                        <div>Fuel: ${tour.costs.fuel}</div>
                        <div>Food: ${tour.costs.food}</div>
                        <div className="font-medium mt-1">
                          Total: ${tour.totalCosts}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${tour.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${tour.profit}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}