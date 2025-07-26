import React, { useState, useEffect } from 'react';
import { TourBooking, Tour, Payment } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  Eye,
  CheckCircle,
  X,
  AlertCircle,
  Filter,
  Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function BookingsManagement() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Get all bookings
      const allBookings = await TourBooking.filter({}, '-created_at');
      setBookings(allBookings || []);

      // Load tour details
      const tourIds = [...new Set(allBookings.map(b => b.tour_id))];
      const tourDetails = await Promise.all(
        tourIds.map(async (tourId) => {
          try {
            return await Tour.get(tourId);
          } catch (error) {
            console.error(`Error loading tour ${tourId}:`, error);
            return { id: tourId, title: 'Unknown Tour', description: 'Tour details unavailable' };
          }
        })
      );

      const toursMap = {};
      tourDetails.forEach((tour, index) => {
        if (tour) {
          toursMap[tourIds[index]] = tour;
        }
      });
      setTours(toursMap);

    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await TourBooking.update(bookingId, { status: newStatus });
      await loadBookings(); // Refresh the list
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', color: 'text-yellow-600', label: 'Pending' },
      pending_payment: { variant: 'secondary', color: 'text-yellow-600', label: 'Pending Payment' },
      confirmed: { variant: 'default', color: 'text-green-600', label: 'Confirmed' },
      completed: { variant: 'success', color: 'text-green-600', label: 'Completed' },
      cancelled: { variant: 'destructive', color: 'text-red-600', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const tour = tours[booking.tour_id];
    const matchesSearch = !searchQuery || 
      booking.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tour?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.booking_reference || booking.id.slice(-8)).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending_payment').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + (b.total_price || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Bookings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${stats.revenue}</div>
            <div className="text-sm text-muted-foreground">Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download size={16} />
              Export
            </Button>
          </div>

          {/* Bookings Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Tourists</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => {
                    const tour = tours[booking.tour_id];
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">
                            #{(booking.booking_reference || booking.id.slice(-8)).toUpperCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(booking.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tour?.title || 'Unknown Tour'}</div>
                          <div className="text-sm text-muted-foreground">
                            {tour?.location?.city || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.contact_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.contact_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{format(parseISO(booking.tour_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{booking.tour_time}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{booking.number_of_tourists}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span>{booking.total_price === 0 ? 'Free' : booking.total_price}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                            {booking.status === 'pending_payment' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              >
                                <CheckCircle size={14} />
                              </Button>
                            )}
                            {['pending', 'pending_payment', 'confirmed'].includes(booking.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' 
                          ? 'No bookings match your filters' 
                          : 'No bookings found'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Booking Details - #{(selectedBooking.booking_reference || selectedBooking.id.slice(-8)).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedBooking.contact_name}</div>
                    <div><strong>Email:</strong> {selectedBooking.contact_email}</div>
                    <div><strong>Phone:</strong> {selectedBooking.contact_phone || 'N/A'}</div>
                    <div><strong>Language:</strong> {selectedBooking.preferred_language}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tour Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Tour:</strong> {tours[selectedBooking.tour_id]?.title || 'Unknown'}</div>
                    <div><strong>Date:</strong> {format(parseISO(selectedBooking.tour_date), 'PPP')}</div>
                    <div><strong>Time:</strong> {selectedBooking.tour_time}</div>
                    <div><strong>Tourists:</strong> {selectedBooking.number_of_tourists}</div>
                    <div><strong>Total:</strong> ${selectedBooking.total_price}</div>
                  </div>
                </div>
              </div>
              
              {selectedBooking.special_requests && (
                <div>
                  <h4 className="font-semibold mb-2">Special Requests</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedBooking.special_requests}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Booking Status</h4>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  <span className="text-sm text-muted-foreground">
                    Created: {format(parseISO(selectedBooking.created_at), 'PPP p')}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}