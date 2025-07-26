import React, { useState } from 'react';
import { TourBooking, Payment, User } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import PaymentService from '@/services/PaymentService';
import NotificationService from '@/services/NotificationService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign,
  CreditCard,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function BookingDialog({ tour, user, isOpen, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    tour_date: null,
    tour_time: '',
    number_of_tourists: 1,
    contact_name: user?.full_name || '',
    contact_email: user?.email || '',
    contact_phone: '',
    special_requests: '',
    preferred_language: 'English'
  });
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    cardholder_name: ''
  });
  const [bookingResult, setBookingResult] = useState(null);

  const price = tour.financials?.price_per_tourist || 0;
  const isFree = price === 0;
  const totalPrice = price * bookingData.number_of_tourists;
  
  // Debug logging
  console.log('BookingDialog - Price info:', { 
    price, 
    isFree, 
    totalPrice, 
    financials: tour.financials,
    user: !!user
  });
  const minTourists = tour.financials?.min_tourists || 1;
  const maxTourists = tour.financials?.max_tourists || 20;

  // Available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field, value) => {
    // Format card number with spaces
    if (field === 'card_number') {
      value = PaymentService.formatCardNumber(value);
    }
    // Format expiry date
    if (field === 'expiry_date') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substr(0, 5);
    }
    // Format CVV (numbers only)
    if (field === 'cvv') {
      value = value.replace(/\D/g, '').substr(0, 4);
    }
    
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    return bookingData.tour_date && 
           bookingData.tour_time && 
           bookingData.contact_name && 
           bookingData.contact_email &&
           bookingData.number_of_tourists >= minTourists &&
           bookingData.number_of_tourists <= maxTourists;
  };

  const validateStep2 = () => {
    if (isFree) return true;
    
    const cardNumber = paymentData.card_number.replace(/\s/g, '');
    return PaymentService.validateCardNumber(cardNumber) &&
           PaymentService.validateExpiryDate(paymentData.expiry_date) &&
           PaymentService.validateCVV(paymentData.cvv) &&
           paymentData.cardholder_name.trim().length > 0;
  };

  const handleNextStep = () => {
    console.log('handleNextStep called:', { step, isFree, validateStep1: validateStep1() });
    
    if (step === 1 && validateStep1()) {
      if (isFree) {
        // For free tours, skip payment and go directly to booking
        handleBookingSubmit();
      } else {
        // For paid tours, go to payment step
        setStep(2);
      }
    } else if (step === 2 && validateStep2()) {
      handleBookingSubmit();
    }
  };

  const handleBookingSubmit = async () => {
    setLoading(true);
    try {
      let bookingUser = user;
      
      // For non-authenticated users, we'll create a guest booking
      // The user account will be created when they access the dashboard via email
      if (!user) {
        console.log('Creating guest booking - user will be created later via email access');
        bookingUser = {
          id: null, // Guest booking
          email: bookingData.contact_email,
          full_name: bookingData.contact_name,
          created_via_booking: true
        };
      }

      // Create the booking
      let booking;
      if (user) {
        // Authenticated user booking
        booking = await TourBooking.create({
          tour_id: tour.id,
          tour_date: format(bookingData.tour_date, 'yyyy-MM-dd'),
          tour_time: bookingData.tour_time,
          number_of_tourists: bookingData.number_of_tourists,
          total_price: totalPrice,
          contact_name: bookingData.contact_name,
          contact_email: bookingData.contact_email,
          contact_phone: bookingData.contact_phone,
          special_requests: bookingData.special_requests,
          preferred_language: bookingData.preferred_language,
          status: isFree ? 'confirmed' : 'pending_payment'
        });
      } else {
        // Guest booking - use localStorage approach
        console.log('Creating guest booking for non-authenticated user');
        booking = await TourBooking.createGuestBooking({
          tour_id: tour.id,
          tour_date: format(bookingData.tour_date, 'yyyy-MM-dd'),
          tour_time: bookingData.tour_time,
          number_of_tourists: bookingData.number_of_tourists,
          total_price: totalPrice,
          contact_name: bookingData.contact_name,
          contact_email: bookingData.contact_email,
          contact_phone: bookingData.contact_phone,
          special_requests: bookingData.special_requests,
          preferred_language: bookingData.preferred_language,
          status: isFree ? 'confirmed' : 'pending_payment'
        });
      }

      // Process payment if not free
      let payment = null;
      if (!isFree) {
        try {
          // Process payment using PaymentService
          const paymentResult = await PaymentService.processPayment({
            amount: totalPrice,
            currency: 'USD',
            card_number: paymentData.card_number.replace(/\s/g, ''),
            expiry_date: paymentData.expiry_date,
            cvv: paymentData.cvv,
            cardholder_name: paymentData.cardholder_name
          });

          // Create payment record
          payment = await Payment.create({
            booking_id: booking.id,
            amount: totalPrice,
            currency: 'USD',
            payment_method: 'card',
            payment_status: 'completed',
            transaction_id: paymentResult.transaction_id,
            payment_provider: 'simulation',
            payment_details: {
              card_last_four: paymentResult.card_last_four,
              cardholder_name: paymentData.cardholder_name,
              processed_at: paymentResult.processed_at
            },
            processed_at: paymentResult.processed_at
          });

          // Update booking status to confirmed
          await TourBooking.update(booking.id, { status: 'confirmed' });
        } catch (paymentError) {
          console.error('Payment processing failed:', paymentError);
          // Delete the booking if payment failed
          await TourBooking.delete(booking.id);
          throw new Error(`Payment failed: ${paymentError.message}`);
        }
      }

      // Send confirmation email
      try {
        await NotificationService.sendBookingConfirmation(booking, tour, bookingUser);
        if (payment) {
          await NotificationService.sendPaymentReceipt(booking, payment, tour, bookingUser);
        }
        // Schedule reminder notifications
        await NotificationService.scheduleReminders(booking, tour);
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the booking if notifications fail
      }

      setBookingResult({ booking, payment });
      setStep(3);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBookingResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Book Your Tour'}
            {step === 2 && 'Payment Details'}
            {step === 3 && 'Booking Confirmed!'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && `Complete your booking for "${tour.title}"`}
            {step === 2 && 'Enter your payment information to complete the booking'}
            {step === 3 && 'Your tour has been successfully booked'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Booking Details */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Tour Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tour.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {minTourists}-{maxTourists} people
                  </div>
                  {!isFree && (
                    <div className="flex items-center font-semibold text-accent">
                      <DollarSign className="mr-1 h-4 w-4" />
                      ${price} per person
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !bookingData.tour_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bookingData.tour_date ? format(bookingData.tour_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bookingData.tour_date}
                    onSelect={(date) => handleInputChange('tour_date', date)}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>Select Time</Label>
              <Select value={bookingData.tour_time} onValueChange={(value) => handleInputChange('tour_time', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Tourists */}
            <div className="space-y-2">
              <Label>Number of Tourists</Label>
              <Select 
                value={bookingData.number_of_tourists.toString()} 
                onValueChange={(value) => handleInputChange('number_of_tourists', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxTourists - minTourists + 1 }, (_, i) => minTourists + i).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={bookingData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={bookingData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={bookingData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select 
                value={bookingData.preferred_language} 
                onValueChange={(value) => handleInputChange('preferred_language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(tour.languages || ['English']).map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label>Special Requests (Optional)</Label>
              <Textarea
                value={bookingData.special_requests}
                onChange={(e) => handleInputChange('special_requests', e.target.value)}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>

            {/* Price Summary */}
            {!isFree && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>${price} × {bookingData.number_of_tourists} people</span>
                      <span>${totalPrice}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tour:</span>
                  <span className="font-medium">{tour.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{format(bookingData.tour_date, "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{bookingData.tour_time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tourists:</span>
                  <span className="font-medium">{bookingData.number_of_tourists}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{isFree ? 'Free' : `$${totalPrice}`}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            {!isFree && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input
                      value={paymentData.card_number}
                      onChange={(e) => handlePaymentChange('card_number', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        value={paymentData.expiry_date}
                        onChange={(e) => handlePaymentChange('expiry_date', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        value={paymentData.cvv}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cardholder Name</Label>
                    <Input
                      value={paymentData.cardholder_name}
                      onChange={(e) => handlePaymentChange('cardholder_name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && bookingResult && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your booking reference is: <strong>#{bookingResult.booking.id.slice(-8).toUpperCase()}</strong>
              </p>
              {!user && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    We've sent you a confirmation email with a link to access your tourist dashboard where you can start your tour.
                  </p>
                </div>
              )}
            </div>
            <Card>
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tour:</span>
                  <span className="font-medium">{tour.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-medium">
                    {format(bookingData.tour_date, "PPP")} at {bookingData.tour_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tourists:</span>
                  <span className="font-medium">{bookingData.number_of_tourists}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-medium">{isFree ? 'Free' : `$${totalPrice}`}</span>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to {bookingData.contact_email}
              {!user && ' with instructions to access your tour.'}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={!validateStep1()}>
                {isFree ? 'Confirm Free Booking' : 'Continue to Payment'}
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleNextStep} disabled={!validateStep2() || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isFree ? 'Confirm Booking' : `Pay $${totalPrice}`}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}