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
}

export interface Hotel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  property_type: 'hotel' | 'resort' | 'homestay' | 'apartment' | 'villa';
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const hotelService = {
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
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching hotels:', error);
        
        // If table doesn't exist, return empty array
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning empty array');
          return { success: true, hotels: [] };
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

  // Mock data for when Supabase is not configured
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
        created_at: '2024-01-25T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z'
      }
    ];
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured hotels:', error);
        
        // If table doesn't exist, return empty array
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning empty array');
          return { success: true, hotels: [] };
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

      const hotel: Hotel = {
        ...data,
        user: data.profiles ? {
          name: data.profiles.name,
          email: data.profiles.email
        } : undefined
      };

      console.log('Hotel fetched successfully:', hotel.name);
      return { success: true, hotel };
    } catch (error) {
      console.error('Error fetching hotel:', error);
      return { success: false, error: 'Failed to fetch hotel' };
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

      const hotel: Hotel = {
        ...data,
        user: data.profiles ? {
          name: data.profiles.name,
          email: data.profiles.email
        } : undefined
      };

      console.log('Hotel fetched successfully:', hotel.name);
      return { success: true, hotel };
    } catch (error) {
      console.error('Error fetching hotel:', error);
      return { success: false, error: 'Failed to fetch hotel' };
    }
  },

  // Get all hotels for admin management
  async getAllHotels(): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
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
        
        // If table doesn't exist, return empty array
        if (error.message.includes('relation "properties" does not exist')) {
          console.log('Properties table does not exist, returning empty array');
          return { success: true, hotels: [] };
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
  async getHotelsByLocation(location: string): Promise<{ success: boolean; error?: string; hotels?: Hotel[] }> {
    try {
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
        .order('price_per_night', { ascending: true })
        .limit(20);

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
  }
};