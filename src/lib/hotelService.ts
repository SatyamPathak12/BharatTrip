import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';

export interface HotelSearchFilters {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  priceRange?: [number, number];
  propertyType?: string[];
  rating?: number;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'name';
  mainCategory?: string;
  subCategory?: string;
  roomType?: string;
}

export interface Hotel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  property_type: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  property_size?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  emergency_contact?: string;
  cancellation_policy?: string;
  check_in_time?: string;
  check_out_time?: string;
  minimum_stay?: number;
  maximum_stay?: number;
  instant_book?: boolean;
  advance_booking_days?: number;
  weekly_discount?: number;
  monthly_discount?: number;
  cleaning_fee?: number;
  security_deposit?: number;
  extra_guest_fee?: number;
  nearby_attractions?: string[];
  transportation_info?: string;
  documents?: any;
  status: string;
  admin_notes?: string;
  verification_notes?: string;
  rejection_reason?: string;
  is_active: boolean;
  is_available: boolean;
  blocked_dates?: string[];
  seo_title?: string;
  seo_description?: string;
  featured?: boolean;
  priority_listing?: boolean;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  verified_at?: string;
  last_modified_at?: string;
  approved_by?: string;
  verified_by?: string;
  last_modified_by?: string;
  main_category?: string;
  sub_category?: string;
  room_type?: string;
  is_multiple?: boolean;
  number_of_properties?: number;
  is_same_location?: boolean;
  bed_configuration?: any;
  allow_children?: boolean;
  offer_cots?: boolean;
  size_unit?: string;
  smoking_allowed?: boolean;
  parties_allowed?: boolean;
  pets_policy?: string;
  pet_charges?: string;
  check_in_from?: string;
  check_in_until?: string;
  check_out_from?: string;
  check_out_until?: string;
  free_cancellation_days?: number;
  accidental_booking_protection?: boolean;
  bulk_listing_notes?: string;
  individual_property_details?: string[];
  listing_type?: string;
  property_addresses?: string[];
  property_rules?: string[];
  post_code?: number;
  user?: {
    name: string;
    email: string;
  };
}

export const hotelService = {
  // Get all approved and available hotels
  async getAllApprovedHotels(): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock data');
        return { success: true, hotels: this.getMockHotels() };
      }

      console.log('Fetching all approved hotels...');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching approved hotels:', error);
        
        // If table doesn't exist, return mock data
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning mock data');
          return { success: true, hotels: this.getMockHotels() };
        }
        
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Fetched ${hotels.length} approved hotels`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error fetching approved hotels:', error);
      return { success: false, error: 'Failed to fetch hotels' };
    }
  },

  // Search hotels with comprehensive filters
  async searchHotels(filters: HotelSearchFilters): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock data');
        return { success: true, hotels: this.getMockHotels() };
      }

      console.log('Searching hotels with filters:', filters);
      
      let query = supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true);

      // Apply destination filter - search in name, location, and address
      if (filters.destination && filters.destination.trim()) {
        const searchTerm = filters.destination.trim();
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      // Apply price range filter
      if (filters.priceRange && filters.priceRange.length === 2) {
        query = query.gte('price_per_night', filters.priceRange[0]).lte('price_per_night', filters.priceRange[1]);
      }

      // Apply property type filter
      if (filters.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType);
      }

      // Apply main category filter
      if (filters.mainCategory) {
        query = query.eq('main_category', filters.mainCategory);
      }

      // Apply sub category filter
      if (filters.subCategory) {
        query = query.eq('sub_category', filters.subCategory);
      }

      // Apply room type filter
      if (filters.roomType) {
        query = query.eq('room_type', filters.roomType);
      }

      // Apply guest capacity filter
      if (filters.guests && filters.guests > 0) {
        query = query.gte('max_guests', filters.guests);
      }

      // Apply amenities filter using array overlap
      if (filters.amenities && filters.amenities.length > 0) {
        // Convert amenity keys to display names for matching
        const amenityDisplayNames = filters.amenities.map(amenity => {
          const amenityMap: { [key: string]: string } = {
            'wifi': 'Free WiFi',
            'pool': 'Swimming Pool',
            'gym': 'Fitness Center',
            'spa': 'Spa & Wellness',
            'restaurant': 'Restaurant',
            'bar': 'Bar/Lounge',
            'parking': 'Free Parking',
            'ac': 'Air Conditioning',
            'tv': 'TV',
            'kitchen': 'Kitchen Access',
            'laundry': 'Laundry Service',
            'concierge': '24/7 Concierge',
            'room_service': 'Room Service',
            'business_center': 'Business Center',
            'conference': 'Conference Rooms',
            'airport_shuttle': 'Airport Shuttle'
          };
          return amenityMap[amenity] || amenity;
        });
        
        query = query.overlaps('amenities', amenityDisplayNames);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_per_night', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_per_night', { ascending: false });
          break;
        case 'rating':
          query = query.order('created_at', { ascending: false }); // Sort by newest as proxy for rating
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching hotels:', error);
        
        // If table doesn't exist, return mock data
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning mock data');
          return { success: true, hotels: this.getMockHotels() };
        }
        
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Found ${hotels.length} hotels matching search criteria`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error searching hotels:', error);
      return { success: false, error: 'Failed to search hotels' };
    }
  },

  // Get featured hotels for homepage
  async getFeaturedHotels(limit: number = 8): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock featured hotels');
        return { success: true, hotels: this.getMockHotels().slice(0, limit) };
      }

      console.log('Fetching featured hotels...');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured hotels:', error);
        
        // If table doesn't exist, return mock data
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning mock data');
          return { success: true, hotels: this.getMockHotels().slice(0, limit) };
        }
        
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Fetched ${hotels.length} featured hotels`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error fetching featured hotels:', error);
      return { success: false, error: 'Failed to fetch featured hotels' };
    }
  },

  // Get hotel by ID with full details
  async getHotelById(hotelId: string): Promise<{ success: boolean; error?: string; hotel?: Hotel }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock hotel data');
        const mockHotel = this.getMockHotels().find(h => h.id === hotelId);
        if (mockHotel) {
          return { success: true, hotel: mockHotel };
        } else {
          return { success: false, error: 'Hotel not found' };
        }
      }

      console.log('Fetching hotel by ID:', hotelId);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('id', hotelId)
        .eq('status', 'approved')
        .single();

      if (error) {
        console.error('Error fetching hotel:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Hotel not found' };
      }

      const hotel: Hotel = {
        ...data,
        user: data.profiles ? {
          name: data.profiles.name,
          email: data.profiles.email
        } : undefined
      };

      console.log('Hotel fetched successfully:', hotel.name);
      return { success: true, hotel };
    } catch (error: any) {
      console.error('Error fetching hotel:', error);
      return { success: false, error: error.message || 'Failed to fetch hotel' };
    }
  },

  // Get all hotels for admin management
  async getAllHotels(): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock data');
        return { success: true, hotels: this.getMockHotels() };
      }

      console.log('Fetching all hotels for admin...');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all hotels:', error);
        
        // If table doesn't exist, return mock data
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning mock data');
          return { success: true, hotels: this.getMockHotels() };
        }
        
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Fetched ${hotels.length} total hotels`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error fetching all hotels:', error);
      return { success: false, error: 'Failed to fetch hotels' };
    }
  },

  // Get hotels by location for quick destination search
  async getHotelsByLocation(location: string, limit: number = 20): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock data');
        return { success: true, hotels: this.getMockHotels() };
      }

      console.log('Fetching hotels by location:', location);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true)
        .ilike('location', `%${location}%`)
        .order('featured', { ascending: false })
        .order('price_per_night', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching hotels by location:', error);
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Found ${hotels.length} hotels in ${location}`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error fetching hotels by location:', error);
      return { success: false, error: 'Failed to fetch hotels by location' };
    }
  },

  // Get hotels by property type
  async getHotelsByType(propertyType: string, limit: number = 20): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock data');
        return { success: true, hotels: this.getMockHotels().filter(h => h.property_type === propertyType) };
      }

      console.log('Fetching hotels by type:', propertyType);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_user_id_fkey(name, email)
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq('property_type', propertyType)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching hotels by type:', error);
        return { success: false, error: error.message };
      }

      // Transform the response
      const hotels: Hotel[] = (data || []).map(property => ({
        ...property,
        user: property.profiles ? {
          name: property.profiles.name,
          email: property.profiles.email
        } : undefined
      }));

      console.log(`Found ${hotels.length} hotels of type ${propertyType}`);
      return { success: true, hotels };
    } catch (error) {
      console.error('Error fetching hotels by type:', error);
      return { success: false, error: 'Failed to fetch hotels by type' };
    }
  },

  // Get available property types with count
  async getPropertyTypesWithCount(): Promise<{ success: boolean; error?: string; types?: any[] }> {
    try {
      // If Supabase is not configured, return mock data
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning mock property types');
        return { 
          success: true, 
          types: [
            { type: 'hotel', count: 5 },
            { type: 'resort', count: 3 },
            { type: 'homestay', count: 2 }
          ] 
        };
      }

      console.log('Fetching property types with count...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('property_type')
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching property types:', error);
        return { success: false, error: error.message };
      }

      // Count occurrences of each type
      const typeCounts = (data || []).reduce((acc: any, item: any) => {
        acc[item.property_type] = (acc[item.property_type] || 0) + 1;
        return acc;
      }, {});

      const types = Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count
      }));

      console.log('Property types with counts:', types);
      return { success: true, types };
    } catch (error) {
      console.error('Error fetching property types:', error);
      return { success: false, error: 'Failed to fetch property types' };
    }
  },

  // Check availability for dates
  async checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<{ success: boolean; available: boolean; error?: string }> {
    try {
      // If Supabase is not configured, return available
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, returning available');
        return { success: true, available: true };
      }

      console.log('Checking availability for property:', propertyId);
      
      const { data: property, error } = await supabase
        .from('properties')
        .select('blocked_dates, is_available')
        .eq('id', propertyId)
        .single();

      if (error) {
        console.error('Error checking availability:', error);
        return { success: false, available: false, error: error.message };
      }

      if (!property.is_available) {
        return { success: true, available: false, error: 'Property is not available' };
      }

      // Check if dates are blocked
      const blockedDates = property.blocked_dates || [];
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const isBlocked = blockedDates.some((blockedDate: string) => {
        const blocked = new Date(blockedDate);
        return blocked >= checkInDate && blocked <= checkOutDate;
      });

      console.log(`Property ${propertyId} availability:`, !isBlocked);
      return { success: true, available: !isBlocked };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { success: false, available: false, error: 'Failed to check availability' };
    }
  },

  // Mock data for when Supabase is not configured or for fallback
  getMockHotels(): Hotel[] {
    return [
      {
        id: '1',
        user_id: 'mock-user',
        name: 'Taj Palace Mumbai',
        description: 'Luxury hotel in the heart of Mumbai with world-class amenities',
        location: 'Mumbai, Maharashtra',
        address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
        property_type: 'hotel',
        price_per_night: 8500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Restaurant', 'Fitness Center', 'Room Service'],
        images: ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
        contact_name: 'Hotel Manager',
        contact_email: 'manager@tajpalace.com',
        contact_phone: '+91 22 6665 3366',
        status: 'approved',
        is_active: true,
        is_available: true,
        featured: true,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        user_id: 'mock-user',
        name: 'Goa Beach Resort',
        description: 'Beautiful beachfront resort with stunning ocean views',
        location: 'Goa',
        address: 'Calangute Beach, North Goa, Goa 403516',
        property_type: 'resort',
        price_per_night: 6200,
        max_guests: 6,
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Bar/Lounge', 'Water Sports'],
        images: ['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'],
        contact_name: 'Resort Manager',
        contact_email: 'manager@goabeach.com',
        contact_phone: '+91 832 227 8800',
        status: 'approved',
        is_active: true,
        is_available: true,
        featured: false,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
      },
      {
        id: '3',
        user_id: 'mock-user',
        name: 'Kerala Homestay',
        description: 'Traditional Kerala home amidst tea plantations',
        location: 'Munnar, Kerala',
        address: 'Tea Garden Road, Munnar, Kerala 685612',
        property_type: 'homestay',
        price_per_night: 3500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['Kitchen Access', 'Garden', 'Mountain View', 'Free WiFi'],
        images: ['https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg'],
        contact_name: 'Local Host',
        contact_email: 'host@keralahome.com',
        contact_phone: '+91 486 523 1234',
        status: 'approved',
        is_active: true,
        is_available: true,
        featured: false,
        created_at: '2024-01-25T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z'
      },
      {
        id: '4',
        user_id: 'mock-user',
        name: 'Rajasthan Palace Hotel',
        description: 'Historic palace hotel with royal heritage',
        location: 'Udaipur, Rajasthan',
        address: 'Lake Palace Road, Udaipur, Rajasthan 313001',
        property_type: 'hotel',
        price_per_night: 12000,
        max_guests: 8,
        bedrooms: 4,
        bathrooms: 3,
        amenities: ['Heritage Architecture', 'Royal Dining', 'Spa & Wellness', 'Cultural Shows', 'Lake View'],
        images: ['https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg'],
        contact_name: 'Palace Manager',
        contact_email: 'manager@palacehotel.com',
        contact_phone: '+91 294 252 8800',
        status: 'approved',
        is_active: true,
        is_available: true,
        featured: false,
        created_at: '2024-01-28T00:00:00Z',
        updated_at: '2024-01-28T00:00:00Z'
      }
    ];
  }
};