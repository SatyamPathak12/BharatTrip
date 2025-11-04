import { supabase } from './supabase';

export interface TourBooking {
  id: string;
  booking_id: string;
  
  // Tour Information
  tour_id: string;
  tour_title: string;
  tour_location: string;
  tour_duration: string;
  
  // User Information
  user_id: string;
  
  // Guest Details
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country: string;
  
  // Booking Details
  travel_date: string;
  number_of_travelers: number;
  children_count: number;
  children_ages: number[];
  special_requests?: string;
  
  // Pricing
  price_per_person: number;
  total_price: number;
  service_fee: number;
  final_total: number;
  discount_applied: number;
  
  // Payment Information
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id?: string;
  transaction_id?: string;
  
  // Booking Status
  booking_status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  cancellation_reason?: string;
  cancelled_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  confirmed_at: string;
  
  // Metadata
  booking_source: string;
  notes?: string;
  admin_notes?: string;
}

export interface CreateBookingData {
  // Tour Information
  tour_id: string;
  tour_title: string;
  tour_location: string;
  tour_duration: string;
  
  // Guest Details
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country: string;
  
  // Booking Details
  travel_date: string;
  number_of_travelers: number;
  children_count?: number;
  children_ages?: number[];
  special_requests?: string;
  
  // Pricing
  price_per_person: number;
  total_price: number;
  service_fee: number;
  final_total: number;
  discount_applied?: number;
  
  // Payment Information
  payment_method: string;
}

export const bookingService = {
  // Generate unique booking ID
  generateBookingId(): string {
    const prefix = 'BT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<{ 
    success: boolean; 
    error?: string; 
    booking?: TourBooking 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Creating tour booking...', bookingData);

      // Generate unique booking ID
      const bookingId = this.generateBookingId();

      // Prepare booking data for database
      const bookingInsertData = {
        booking_id: bookingId,
        
        // Tour Information
        tour_id: bookingData.tour_id,
        tour_title: bookingData.tour_title,
        tour_location: bookingData.tour_location,
        tour_duration: bookingData.tour_duration,
        
        // User Information
        user_id: user.id,
        
        // Guest Details
        guest_first_name: bookingData.guest_first_name,
        guest_last_name: bookingData.guest_last_name,
        guest_email: bookingData.guest_email,
        guest_phone: bookingData.guest_phone,
        guest_country: bookingData.guest_country,
        
        // Booking Details
        travel_date: bookingData.travel_date,
        number_of_travelers: bookingData.number_of_travelers,
        children_count: bookingData.children_count || 0,
        children_ages: bookingData.children_ages || [],
        special_requests: bookingData.special_requests || null,
        
        // Pricing
        price_per_person: bookingData.price_per_person,
        total_price: bookingData.total_price,
        service_fee: bookingData.service_fee,
        final_total: bookingData.final_total,
        discount_applied: bookingData.discount_applied || 0,
        
        // Payment Information
        payment_method: bookingData.payment_method,
        payment_status: 'completed', // In real app, this would be 'pending' until payment confirmation
        
        // Booking Status
        booking_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        
        // Metadata
        booking_source: 'website'
      };

      const { data, error } = await supabase
        .from('tour_bookings')
        .insert([bookingInsertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
      }

      console.log('Booking created successfully:', data);

      return { success: true, booking: data as TourBooking };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  },

  // Get user's bookings
  async getUserBookings(): Promise<{ 
    success: boolean; 
    error?: string; 
    bookings?: TourBooking[] 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Fetching user bookings...');

      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: error.message };
      }

      console.log('Bookings fetched successfully:', data?.length || 0);

      return { success: true, bookings: data as TourBooking[] };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: 'Failed to fetch bookings' };
    }
  },

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<{ 
    success: boolean; 
    error?: string; 
    booking?: TourBooking 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Fetching booking:', bookingId);

      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        return { success: false, error: error.message };
      }

      console.log('Booking fetched successfully:', data);

      return { success: true, booking: data as TourBooking };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return { success: false, error: 'Failed to fetch booking' };
    }
  },

  // Get all bookings (admin only)
  async getAllBookings(): Promise<{ 
    success: boolean; 
    error?: string; 
    bookings?: TourBooking[] 
  }> {
    try {
      console.log('Fetching all bookings...');

      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bookings:', error);
        return { success: false, error: error.message };
      }

      console.log('All bookings fetched successfully:', data?.length || 0);

      return { success: true, bookings: data as TourBooking[] };
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      return { success: false, error: 'Failed to fetch bookings' };
    }
  },

  // Update booking status
  async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'cancelled' | 'completed' | 'pending',
    cancellationReason?: string
  ): Promise<{ 
    success: boolean; 
    error?: string; 
    booking?: TourBooking 
  }> {
    try {
      console.log('Updating booking status:', bookingId, status);

      const updateData: any = {
        booking_status: status
      };

      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (cancellationReason) {
          updateData.cancellation_reason = cancellationReason;
        }
      }

      const { data, error } = await supabase
        .from('tour_bookings')
        .update(updateData)
        .eq('booking_id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        return { success: false, error: error.message };
      }

      console.log('Booking updated successfully:', data);

      return { success: true, booking: data as TourBooking };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: 'Failed to update booking' };
    }
  },

  // Cancel booking
  async cancelBooking(
    bookingId: string, 
    reason: string
  ): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      console.log('Cancelling booking:', bookingId);

      const { error } = await supabase
        .from('tour_bookings')
        .update({
          booking_status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: error.message };
      }

      console.log('Booking cancelled successfully');

      return { success: true };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: 'Failed to cancel booking' };
    }
  },

  // Get bookings by tour ID
  async getBookingsByTourId(tourId: string): Promise<{ 
    success: boolean; 
    error?: string; 
    bookings?: TourBooking[] 
  }> {
    try {
      console.log('Fetching bookings for tour:', tourId);

      const { data, error } = await supabase
        .from('tour_bookings')
        .select('*')
        .eq('tour_id', tourId)
        .order('travel_date', { ascending: true });

      if (error) {
        console.error('Error fetching tour bookings:', error);
        return { success: false, error: error.message };
      }

      console.log('Tour bookings fetched successfully:', data?.length || 0);

      return { success: true, bookings: data as TourBooking[] };
    } catch (error) {
      console.error('Error fetching tour bookings:', error);
      return { success: false, error: 'Failed to fetch tour bookings' };
    }
  }
};