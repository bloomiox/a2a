// Notification Service - Handle booking confirmations and notifications
// In a real application, this would integrate with email services like SendGrid, Mailgun, etc.

class NotificationService {
  // Send booking confirmation email
  static async sendBookingConfirmation(booking, tour, user) {
    try {
      console.log('Sending booking confirmation email...');
      
      // In a real app, you would call your email service API here
      // For now, we'll simulate the email sending
      
      const isNewUser = user?.created_via_booking || booking._isGuestBooking || false;
      
      // Generate a secure login token for new users
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
      let dashboardUrl = `${baseUrl}/tourist-dashboard`;
      if (isNewUser) {
        const userId = user?.id || 'guest';
        const storageKey = booking._storageKey || null;
        const loginToken = this.generateLoginToken(userId, booking.id, storageKey);
        dashboardUrl = `${baseUrl}/auth-callback?token=${loginToken}&redirect=tourist-dashboard`;
      }
      
      const emailData = {
        to: booking.contact_email,
        subject: `Booking Confirmation - ${tour.title}`,
        template: 'booking_confirmation',
        data: {
          user_name: booking.contact_name,
          tour_title: tour.title,
          tour_date: booking.tour_date,
          tour_time: booking.tour_time,
          number_of_tourists: booking.number_of_tourists,
          total_price: booking.total_price,
          booking_reference: booking.booking_reference || booking.id.slice(-8).toUpperCase(),
          special_requests: booking.special_requests,
          preferred_language: booking.preferred_language,
          is_new_user: isNewUser,
          dashboard_login_url: dashboardUrl
        }
      };

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Booking confirmation email sent:', emailData);
      
      return {
        success: true,
        message_id: `msg_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      throw error;
    }
  }

  // Send booking cancellation email
  static async sendBookingCancellation(booking, tour, user) {
    try {
      console.log('Sending booking cancellation email...');
      
      const emailData = {
        to: booking.contact_email,
        subject: `Booking Cancelled - ${tour.title}`,
        template: 'booking_cancellation',
        data: {
          user_name: booking.contact_name,
          tour_title: tour.title,
          tour_date: booking.tour_date,
          tour_time: booking.tour_time,
          booking_reference: booking.booking_reference || booking.id.slice(-8).toUpperCase(),
          cancellation_date: new Date().toISOString()
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Booking cancellation email sent:', emailData);
      
      return {
        success: true,
        message_id: `msg_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send booking cancellation:', error);
      throw error;
    }
  }

  // Send payment receipt
  static async sendPaymentReceipt(booking, payment, tour, user) {
    try {
      console.log('Sending payment receipt...');
      
      const emailData = {
        to: booking.contact_email,
        subject: `Payment Receipt - ${tour.title}`,
        template: 'payment_receipt',
        data: {
          user_name: booking.contact_name,
          tour_title: tour.title,
          amount: payment.amount,
          currency: payment.currency,
          transaction_id: payment.transaction_id,
          payment_date: payment.processed_at,
          booking_reference: booking.booking_reference || booking.id.slice(-8).toUpperCase()
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Payment receipt sent:', emailData);
      
      return {
        success: true,
        message_id: `msg_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send payment receipt:', error);
      throw error;
    }
  }

  // Send tour reminder (24 hours before)
  static async sendTourReminder(booking, tour, user) {
    try {
      console.log('Sending tour reminder...');
      
      const emailData = {
        to: booking.contact_email,
        subject: `Tour Reminder - ${tour.title} Tomorrow`,
        template: 'tour_reminder',
        data: {
          user_name: booking.contact_name,
          tour_title: tour.title,
          tour_date: booking.tour_date,
          tour_time: booking.tour_time,
          number_of_tourists: booking.number_of_tourists,
          meeting_point: tour.location?.address || 'See tour details',
          booking_reference: booking.booking_reference || booking.id.slice(-8).toUpperCase(),
          special_requests: booking.special_requests
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Tour reminder sent:', emailData);
      
      return {
        success: true,
        message_id: `msg_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send tour reminder:', error);
      throw error;
    }
  }

  // Send SMS notification (for urgent updates)
  static async sendSMSNotification(phoneNumber, message) {
    try {
      console.log('Sending SMS notification...');
      
      // In a real app, you would integrate with Twilio, AWS SNS, etc.
      const smsData = {
        to: phoneNumber,
        message: message,
        sent_at: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('SMS notification sent:', smsData);
      
      return {
        success: true,
        message_id: `sms_${Date.now()}`,
        sent_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  // Generate email templates
  static generateEmailTemplate(templateType, data) {
    const templates = {
      booking_confirmation: {
        subject: `Booking Confirmation - ${data.tour_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Confirmed!</h2>
            <p>Dear ${data.user_name},</p>
            <p>Your booking for <strong>${data.tour_title}</strong> has been confirmed.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Booking Details</h3>
              <p><strong>Date:</strong> ${data.tour_date}</p>
              <p><strong>Time:</strong> ${data.tour_time}</p>
              <p><strong>Number of Tourists:</strong> ${data.number_of_tourists}</p>
              <p><strong>Total Price:</strong> ${data.total_price === 0 ? 'Free' : `$${data.total_price}`}</p>
              <p><strong>Booking Reference:</strong> ${data.booking_reference}</p>
              ${data.special_requests ? `<p><strong>Special Requests:</strong> ${data.special_requests}</p>` : ''}
            </div>
            
            ${data.is_new_user ? `
            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="color: #2563eb; margin-top: 0;">Access Your Tourist Dashboard</h3>
              <p>We've created an account for you to manage your bookings and start your tour.</p>
              <p style="margin: 15px 0;">
                <a href="${data.dashboard_login_url}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Access Your Dashboard
                </a>
              </p>
              <p style="font-size: 14px; color: #666;">
                Click the button above to access your tourist dashboard where you can start your tour and manage your bookings.
              </p>
            </div>
            ` : ''}
            
            <p>We look forward to providing you with an amazing tour experience!</p>
            <p>Best regards,<br>The AudioGuide Team</p>
          </div>
        `
      },
      booking_cancellation: {
        subject: `Booking Cancelled - ${data.tour_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Booking Cancelled</h2>
            <p>Dear ${data.user_name},</p>
            <p>Your booking for <strong>${data.tour_title}</strong> has been cancelled as requested.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Cancelled Booking Details</h3>
              <p><strong>Date:</strong> ${data.tour_date}</p>
              <p><strong>Time:</strong> ${data.tour_time}</p>
              <p><strong>Booking Reference:</strong> ${data.booking_reference}</p>
            </div>
            
            <p>If you paid for this booking, a refund will be processed within 3-5 business days.</p>
            <p>We hope to see you on a future tour!</p>
            <p>Best regards,<br>The AudioGuide Team</p>
          </div>
        `
      },
      tour_reminder: {
        subject: `Tour Reminder - ${data.tour_title} Tomorrow`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Tour Reminder</h2>
            <p>Dear ${data.user_name},</p>
            <p>This is a friendly reminder that your tour <strong>${data.tour_title}</strong> is scheduled for tomorrow!</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Tour Details</h3>
              <p><strong>Date:</strong> ${data.tour_date}</p>
              <p><strong>Time:</strong> ${data.tour_time}</p>
              <p><strong>Number of Tourists:</strong> ${data.number_of_tourists}</p>
              <p><strong>Meeting Point:</strong> ${data.meeting_point}</p>
              <p><strong>Booking Reference:</strong> ${data.booking_reference}</p>
              ${data.special_requests ? `<p><strong>Special Requests:</strong> ${data.special_requests}</p>` : ''}
            </div>
            
            <p>Please arrive 15 minutes early and bring a fully charged mobile device.</p>
            <p>We're excited to see you tomorrow!</p>
            <p>Best regards,<br>The AudioGuide Team</p>
          </div>
        `
      }
    };

    return templates[templateType] || null;
  }

  // Generate a secure login token for email authentication
  static generateLoginToken(userId, bookingId, storageKey = null) {
    // In a real app, you would use a proper JWT library and store tokens in database
    // For now, we'll create a simple base64 encoded token with timestamp
    const tokenData = {
      userId,
      bookingId,
      storageKey,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    return btoa(JSON.stringify(tokenData));
  }

  // Verify login token
  static verifyLoginToken(token) {
    try {
      const tokenData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        return { valid: false, error: 'Token expired' };
      }
      
      return { 
        valid: true, 
        userId: tokenData.userId, 
        bookingId: tokenData.bookingId,
        storageKey: tokenData.storageKey
      };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Schedule reminder notifications
  static async scheduleReminders(booking, tour) {
    try {
      // In a real app, you would use a job queue system like Bull, Agenda, or cloud functions
      console.log('Scheduling reminder notifications for booking:', booking.id);
      
      // Calculate reminder times
      const tourDateTime = new Date(`${booking.tour_date}T${booking.tour_time}`);
      const reminderTime = new Date(tourDateTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
      
      // Store reminder job (in a real app, this would be in a job queue)
      const reminderJob = {
        id: `reminder_${booking.id}`,
        booking_id: booking.id,
        tour_id: booking.tour_id,
        scheduled_for: reminderTime.toISOString(),
        type: 'tour_reminder',
        status: 'scheduled'
      };

      console.log('Reminder scheduled:', reminderJob);
      
      return reminderJob;
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
      throw error;
    }
  }
}

export default NotificationService;