import { supabase } from './supabase';

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
  duration?: string;
}

export interface TourData {
  title: string;
  location: string;
  duration: string;
  description: string;
  date: string;
  price: number;
  original_price: number;
  group_size: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Difficult';
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Wildlife' | 'Beach' | 'Heritage';
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: TourItineraryDay[];
  images: string[];
  videos: string[];
  is_active: boolean;
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  languages?: string[];
  contact_phone?: string;
  contact_email?: string;
  cancellation_policy?: string;
}

export interface Tour extends TourData {
  id: string;
  created_by: string;
  rating: number;
  reviews_count: number;
  status: 'active' | 'inactive' | 'draft';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  last_modified_at: string;
  last_modified_by?: string;
  creator?: {
    name: string;
    email: string;
  };
  discount_percentage?: number;
  total_days?: number;
  included?: string[];  // Alias for includes
  excluded?: string[];  // Alias for excludes
}

export const tourService = {
  // Upload tour media (images/videos)
  async uploadTourMedia(file: File, tourId?: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Validate file size based on type
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for videos, 5MB for images
      
      if (file.size > maxSize) {
        const maxSizeText = isVideo ? '50MB' : '5MB';
        return { success: false, error: `File size must be less than ${maxSizeText}` };
      }

      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return { success: false, error: 'Only image and video files are allowed' };
      }

      // Create file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = tourId ? `${user.id}/${tourId}/${fileName}` : `${user.id}/temp/${fileName}`;

      console.log('Uploading tour media to path:', filePath);

      // Upload file to tour-media bucket
      const { data, error } = await supabase.storage
        .from('tour-media')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading tour media:', error);
        return { success: false, error: error.message };
      }

      console.log('Tour media uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tour-media')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading tour media:', error);
      return { success: false, error: 'Failed to upload media' };
    }
  },

  // Transform tour data to include aliases
  transformTourData(data: any): Tour {
    return {
      ...data,
      included: data.includes || [],  // Alias for includes
      excluded: data.excludes || [],  // Alias for excludes
      languages: data.languages || ['English', 'Hindi'],
      contact_phone: data.contact_phone || '+91 1800 123 4567',
      contact_email: data.contact_email || 'tours@example.com',
      cancellation_policy: data.cancellation_policy || 'Free cancellation up to 24 hours before the tour starts. 50% refund for cancellations made 24-48 hours before. No refund for cancellations made less than 24 hours before the tour.',
      discount_percentage: data.original_price > data.price ? 
        Math.round(((data.original_price - data.price) / data.original_price) * 100) : 0,
      total_days: Array.isArray(data.itinerary) ? data.itinerary.length : 0
    };
  },

  // Create a new tour
  async createTour(tourData: TourData): Promise<{ success: boolean; error?: string; tour?: Tour }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Creating tour with data:', tourData);

      // Prepare tour data for database
      const tourInsertData = {
        title: tourData.title,
        location: tourData.location,
        duration: tourData.duration,
        description: tourData.description,
        date: tourData.date,
        price: tourData.price,
        original_price: tourData.original_price,
        group_size: tourData.group_size,
        difficulty: tourData.difficulty,
        category: tourData.category,
        highlights: tourData.highlights,
        includes: tourData.includes,
        excludes: tourData.excludes,
        itinerary: tourData.itinerary,
        images: tourData.images,
        videos: tourData.videos,
        is_active: tourData.is_active,
        is_available: true,
        featured: tourData.featured || false,
        priority_listing: false,
        seo_title: tourData.seo_title,
        seo_description: tourData.seo_description,
        languages: tourData.languages || ['English', 'Hindi'],
        contact_phone: tourData.contact_phone || '+91 1800 123 4567',
        contact_email: tourData.contact_email || 'tours@example.com',
        cancellation_policy: tourData.cancellation_policy || 'Free cancellation up to 24 hours before the tour starts.',
        max_bookings_per_day: 1,
        advance_booking_days: 90,
        rating: 4.5,
        reviews_count: 0,
        created_by: user.id,
        status: tourData.is_active ? 'active' : 'draft'
      };

      // Only add published_at if tour is active
      if (tourData.is_active) {
        tourInsertData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tours')
        .insert([tourInsertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating tour:', error);
        return { success: false, error: error.message };
      }

      console.log('Tour created successfully:', data);

      // Fetch creator profile for the response
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();

      // Transform the response to match our Tour interface
      const tour: Tour = this.transformTourData({
        ...data,
        creator: creatorProfile ? {
          name: creatorProfile.name,
          email: creatorProfile.email
        } : undefined
      });

      return { success: true, tour };
    } catch (error) {
      console.error('Error creating tour:', error);
      return { success: false, error: 'Failed to create tour' };
    }
  },

  // Get all tours for admin
  async getAllTours(): Promise<{ success: boolean; error?: string; tours?: Tour[] }> {
    try {
      console.log('Fetching all tours...');
      
      const { data, error } = await supabase
        .from('tours')
        .select(`
          *,
          profiles!tours_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tours:', error);
        
        // If table doesn't exist, return empty array instead of error
        if (error.message.includes('relation "tours" does not exist')) {
          console.log('Tours table does not exist, returning empty array');
          return { success: true, tours: [] };
        }
        
        return { success: false, error: error.message };
      }

      console.log('Tours fetched successfully:', data?.length || 0);

      // Transform the response
      const tours: Tour[] = (data || []).map(tour => this.transformTourData({
        ...tour,
        creator: tour.profiles ? {
          name: tour.profiles.name,
          email: tour.profiles.email
        } : undefined
      }));

      return { success: true, tours };
    } catch (error) {
      console.error('Error fetching tours:', error);
      return { success: false, error: 'Failed to fetch tours' };
    }
  },

  // Get public tours (for frontend display)
  async getPublicTours(filters?: {
    category?: string;
    difficulty?: string;
    priceRange?: [number, number];
    destination?: string;
  }): Promise<{ success: boolean; error?: string; tours?: Tour[] }> {
    try {
      let query = supabase
        .from('tours')
        .select('*')
        .eq('status', 'active')
        .eq('is_active', true)
        .eq('is_available', true);

      // Apply filters if provided
      if (filters) {
        if (filters.category && filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }
        if (filters.difficulty && filters.difficulty !== 'all') {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters.priceRange) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }
        if (filters.destination) {
          query = query.or(`location.ilike.%${filters.destination}%,title.ilike.%${filters.destination}%`);
        }
      }

      query = query.order('featured', { ascending: false })
                  .order('rating', { ascending: false })
                  .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching public tours:', error);
        
        // If table doesn't exist, return empty array
        if (error.message.includes('relation "tours" does not exist')) {
          return { success: true, tours: [] };
        }
        
        return { success: false, error: error.message };
      }

      const tours: Tour[] = (data || []).map(tour => this.transformTourData(tour));

      return { success: true, tours };
    } catch (error) {
      console.error('Error fetching public tours:', error);
      return { success: false, error: 'Failed to fetch tours' };
    }
  },

  // Update tour
  async updateTour(tourId: string, tourData: Partial<TourData>): Promise<{ success: boolean; error?: string; tour?: Tour }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData = {
        ...tourData,
        status: tourData.is_active ? 'active' : 'draft',
        published_at: tourData.is_active ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('tours')
        .update(updateData)
        .eq('id', tourId)
        .select()
        .single();

      if (error) {
        console.error('Error updating tour:', error);
        return { success: false, error: error.message };
      }

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.created_by)
        .single();

      const tour: Tour = this.transformTourData({
        ...data,
        creator: creatorProfile ? {
          name: creatorProfile.name,
          email: creatorProfile.email
        } : undefined
      });

      return { success: true, tour };
    } catch (error) {
      console.error('Error updating tour:', error);
      return { success: false, error: 'Failed to update tour' };
    }
  },

  // Delete tour
  async deleteTour(tourId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', tourId);

      if (error) {
        console.error('Error deleting tour:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting tour:', error);
      return { success: false, error: 'Failed to delete tour' };
    }
  },

  // Get tour by ID
  async getTourById(tourId: string): Promise<{ success: boolean; error?: string; tour?: Tour }> {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();

      if (error) {
        console.error('Error fetching tour:', error);
        return { success: false, error: error.message };
      }

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.created_by)
        .single();

      const tour: Tour = this.transformTourData({
        ...data,
        creator: creatorProfile ? {
          name: creatorProfile.name,
          email: creatorProfile.email
        } : undefined
      });

      return { success: true, tour };
    } catch (error) {
      console.error('Error fetching tour:', error);
      return { success: false, error: 'Failed to fetch tour' };
    }
  }
};