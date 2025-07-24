import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Tour } from "@/api/entities";
import { TourAssignment } from "@/api/entities";
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function Tourists() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tourists, setTourists] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tourFilter, setTourFilter] = useState("all");
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all tours first
      const toursData = await Tour.list();
      setTours(toursData);

      // Get all users who are tourists
      const users = await User.list();
      const touristsData = users.filter(user => 
        user.user_group?.includes("Tourist")
      );

      // Get assignments for each tourist
      const touristsWithDetails = await Promise.all(
        touristsData.map(async (tourist) => {
          const assignments = await TourAssignment.filter({
            tourist_id: tourist.id
          });

          const tourDetails = await Promise.all(
            assignments.map(async (assignment) => {
              const tour = toursData.find(t => t.id === assignment.tour_id);
              return {
                ...tour,
                assignment_date: assignment.start_time,
                status: assignment.status,
                price: tour?.financials?.price_per_tourist || 0
              };
            })
          );

          // Calculate statistics
          const totalSpent = tourDetails.reduce((sum, tour) => sum + tour.price, 0);
          const completedTours = tourDetails.filter(t => t.status === 'completed').length;

          return {
            ...tourist,
            tours: tourDetails,
            stats: {
              totalSpent,
              completedTours,
              averageRating: 4.5, // This would come from a ratings entity in a real app
              lastActive: tourist.last_active_date || tourist.created_date
            }
          };
        })
      );

      setTourists(touristsWithDetails);
    } catch (error) {
      console.error("Error loading tourist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = tourist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tourist.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tourist.status === statusFilter;
    const matchesTour = tourFilter === "all" || 
                       tourist.tours.some(tour => tour.id === tourFilter);
    
    return matchesSearch && matchesStatus && matchesTour;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('tourists.title')}</h1>
          <p className="text-gray-500">{t('tourists.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder={t('tourists.searchTourists')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('tourists.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tourFilter} onValueChange={setTourFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('tourists.filterByTour')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tours</SelectItem>
            {tours.map(tour => (
              <SelectItem key={tour.id} value={tour.id}>
                {tour.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tourists List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tourists.title')}</CardTitle>
          <CardDescription>{t('tourists.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tourist</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tours</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTourists.map((tourist) => (
                <TableRow 
                  key={tourist.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedTourist(tourist);
                    setShowDetails(true);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {tourist.profile_image ? (
                          <img
                            src={tourist.profile_image}
                            alt={tourist.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-lg">
                            {tourist.full_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{tourist.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(tourist.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {tourist.email}
                      </div>
                      {tourist.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {tourist.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{tourist.stats.completedTours} completed</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tourist.tours.slice(0, 2).map(tour => (
                          <Badge
                            key={tour.id}
                            variant={tour.status === 'completed' ? 'success' : 'default'}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(createPageUrl(`TourDetails?id=${tour.id}`));
                            }}
                          >
                            {tour.title}
                          </Badge>
                        ))}
                        {tourist.tours.length > 2 && (
                          <Badge variant="outline">
                            +{tourist.tours.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${tourist.stats.totalSpent}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tourist.status === 'active' ? 'success' : 'secondary'}
                    >
                      {t(`tourists.status.${tourist.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(tourist.stats.lastActive), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tourist Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('tourists.touristDetails')}</DialogTitle>
          </DialogHeader>
          
          {selectedTourist && (
            <div className="space-y-6">
              {/* Tourist Info */}
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  {selectedTourist.profile_image ? (
                    <img
                      src={selectedTourist.profile_image}
                      alt={selectedTourist.full_name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-3xl">
                      {selectedTourist.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedTourist.full_name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {selectedTourist.email}
                      </div>
                      {selectedTourist.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedTourist.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('tourists.touristSince')}: {format(new Date(selectedTourist.created_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        {t('tourists.totalSpent')}: ${selectedTourist.stats.totalSpent}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t('tourists.toursCompleted')}: {selectedTourist.stats.completedTours}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2" />
                        {t('tourists.averageRating')}: {selectedTourist.stats.averageRating}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tours */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">{t('tourists.bookedTours')}</h4>
                
                <div className="space-y-4">
                  {selectedTourist.tours.length > 0 ? (
                    selectedTourist.tours.map(tour => (
                      <Card key={tour.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto"
                                  onClick={() => {
                                    setShowDetails(false);
                                    navigate(createPageUrl(`TourDetails?id=${tour.id}`));
                                  }}
                                >
                                  {tour.title}
                                </Button>
                              </h5>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {tour.location.city}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {format(new Date(tour.assignment_date), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  ${tour.price}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={tour.status === 'completed' ? 'success' : 'default'}
                            >
                              {t(`driver.status.${tour.status}`)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="font-medium">{t('tourists.noToursBooked')}</p>
                        <p className="text-sm mt-1">{t('tourists.noToursBookedDesc')}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}