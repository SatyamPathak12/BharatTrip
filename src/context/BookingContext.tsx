import React, { createContext, useContext, useState, ReactNode } from 'react';
import { hotelService, HotelSearchFilters } from '../lib/hotelService';

interface SearchFilters {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  priceRange: [number, number];
  propertyType: string[];
  rating: number;
  amenities: string[];
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'name';
}

interface BookingContextType {
  searchFilters: SearchFilters;
  properties: any[];
  loading: boolean;
  error: string | null;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  searchHotels: (filters?: Partial<SearchFilters>) => Promise<void>;
  clearFilters: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    priceRange: [500, 15000],
    propertyType: [],
    rating: 0,
    amenities: [],
    sortBy: 'price_asc'
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSearchFilters = (filters: Partial<SearchFilters>) => {
    setSearchFilters(prev => ({
      ...prev,
      ...filters
    }));
  };

  const searchHotels = async (additionalFilters?: Partial<SearchFilters>) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentFilters = additionalFilters 
        ? { ...searchFilters, ...additionalFilters }
        : searchFilters;

      const hotelFilters: HotelSearchFilters = {
        destination: currentFilters.destination,
        checkIn: currentFilters.checkIn,
        checkOut: currentFilters.checkOut,
        guests: currentFilters.guests,
        rooms: currentFilters.rooms,
        priceRange: currentFilters.priceRange,
        propertyType: currentFilters.propertyType,
        rating: currentFilters.rating,
        amenities: currentFilters.amenities,
        sortBy: currentFilters.sortBy
      };

      console.log('Searching hotels with filters:', hotelFilters);
      
      const result = await hotelService.searchHotels(hotelFilters);
      
      if (result.success && result.hotels) {
        // Transform database hotels to match UI format
        const transformedHotels = result.hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          location: hotel.location,
          price: hotel.price_per_night,
          rating: 4.0 + Math.random() * 0.9,
          images: hotel.images && hotel.images.length > 0 
            ? hotel.images 
            : ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
          amenities: hotel.amenities || [],
          type: hotel.property_type,
          description: hotel.description,
          available: hotel.is_available,
          maxGuests: hotel.max_guests,
          bedrooms: hotel.bedrooms,
          bathrooms: hotel.bathrooms,
          owner: hotel.user?.name || 'Property Owner'
        }));

        setProperties(transformedHotels);
        console.log(`Found ${transformedHotels.length} hotels`);
      } else {
        console.error('Failed to search hotels:', result.error);
        setError(result.error || 'Failed to search hotels');
        setProperties([]);
      }
    } catch (err: any) {
      console.error('Error searching hotels:', err);
      setError('Failed to search hotels. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      destination: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      rooms: 1,
      priceRange: [500, 15000],
      propertyType: [],
      rating: 0,
      amenities: [],
      sortBy: 'price_asc'
    });
    setProperties([]);
    setError(null);
  };

  return (
    <BookingContext.Provider value={{
      searchFilters,
      properties,
      loading,
      error,
      updateSearchFilters,
      searchHotels,
      clearFilters
    }}>
      {children}
    </BookingContext.Provider>
  );
};