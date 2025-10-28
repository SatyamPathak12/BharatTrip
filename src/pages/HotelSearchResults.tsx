import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Calendar, Users, Star, MapPin, Filter, SlidersHorizontal, X, Heart, Share2, Bed, Bath, Wifi, Car, Coffee, Waves } from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useAuth } from '../context/AuthContext';
import { hotelService, HotelSearchFilters } from '../lib/hotelService';

const HotelSearchResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get search parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const [searchFilters, setSearchFilters] = useState({
    destination: searchParams.get('destination') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests') || '2'),
    rooms: parseInt(searchParams.get('rooms') || '1'),
    priceRange: [500, 15000] as [number, number],
    propertyType: [] as string[],
    rating: 0,
    amenities: [] as string[],
    sortBy: 'price_asc' as 'price_asc' | 'price_desc' | 'rating' | 'name'
  });

  // Search hotels when component mounts and when non-text filters change
  useEffect(() => {
    // Only search immediately for non-text filters or initial load
    const isTextFilter = false; // This effect handles non-text filters
    searchHotels();
  }, [
    searchFilters.checkIn,
    searchFilters.checkOut,
    searchFilters.guests,
    searchFilters.rooms,
    searchFilters.priceRange,
    searchFilters.propertyType,
    searchFilters.rating,
    searchFilters.amenities,
    searchFilters.sortBy
  ]);

  // Separate effect for destination search with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for destination search
    const timeout = setTimeout(() => {
      searchHotels();
    }, 500); // 500ms delay

    setSearchTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchFilters.destination]);

  const searchHotels = async () => {
    // Only show loading for initial search or major filter changes
    if (hotels.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const filters: HotelSearchFilters = {
        destination: searchFilters.destination,
        checkIn: searchFilters.checkIn,
        checkOut: searchFilters.checkOut,
        guests: searchFilters.guests,
        rooms: searchFilters.rooms,
        priceRange: searchFilters.priceRange,
        propertyType: searchFilters.propertyType,
        rating: searchFilters.rating,
        amenities: searchFilters.amenities,
        sortBy: searchFilters.sortBy
      };

      const result = await hotelService.searchHotels(filters);
      
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

        setHotels(transformedHotels);
      } else {
        console.error('Failed to search hotels:', result.error);
        // Use fallback mock data if database fails
        setHotels(getMockHotels());
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      setError('Failed to search hotels. Please try again.');
      setHotels(getMockHotels());
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data
  const getMockHotels = () => [
    {
      id: '1',
      name: 'Taj Palace Mumbai',
      location: 'Mumbai, Maharashtra',
      price: 8500,
      rating: 4.8,
      images: ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
      amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Restaurant'],
      type: 'hotel',
      description: 'Luxury hotel in the heart of Mumbai',
      available: true,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      owner: 'Taj Hotels'
    },
    {
      id: '2',
      name: 'Goa Beach Resort',
      location: 'Goa',
      price: 6200,
      rating: 4.5,
      images: ['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'],
      amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Bar/Lounge'],
      type: 'resort',
      description: 'Beachfront resort with stunning ocean views',
      available: true,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      owner: 'Beach Resorts Ltd'
    },
    {
      id: '3',
      name: 'Kerala Homestay',
      location: 'Munnar, Kerala',
      price: 3500,
      rating: 4.3,
      images: ['https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg'],
      amenities: ['Kitchen Access', 'Garden', 'Mountain View'],
      type: 'homestay',
      description: 'Traditional Kerala home amidst tea plantations',
      available: true,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      owner: 'Local Family'
    }
  ];

  const handleFilterChange = (filterType: string, value: any) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearAllFilters = () => {
    setSearchFilters(prev => ({
      ...prev,
      priceRange: [500, 15000] as [number, number],
      propertyType: [],
      rating: 0,
      amenities: [],
      sortBy: 'price_asc' as 'price_asc' | 'price_desc' | 'rating' | 'name'
    }));
  };

  const handleBookNow = (hotel: any) => {
    if (user) {
      navigate(`/hotel-booking/${hotel.id}`);
    } else {
      sessionStorage.setItem('redirectAfterLogin', `/hotel-booking/${hotel.id}`);
      navigate('/login');
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Free WiFi': <Wifi className="h-4 w-4" />,
      'Swimming Pool': <Waves className="h-4 w-4" />,
      'Restaurant': <Coffee className="h-4 w-4" />,
      'Free Parking': <Car className="h-4 w-4" />
    };
    return iconMap[amenity] || <Star className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for hotels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="page" />
      
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Form */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Where</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Destination, hotel, landmark..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    value={searchFilters.destination}
                    onChange={(e) => handleFilterChange('destination', e.target.value)}
                  />
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="md:col-span-2">
                <DatePicker
                  checkIn={searchFilters.checkIn}
                  checkOut={searchFilters.checkOut}
                  onCheckInChange={(date) => handleFilterChange('checkIn', date)}
                  onCheckOutChange={(date) => handleFilterChange('checkOut', date)}
                />
              </div>

              {/* Guests & Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests & Rooms</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 appearance-none"
                    value={`${searchFilters.guests}-${searchFilters.rooms}`}
                    onChange={(e) => {
                      const [guests, rooms] = e.target.value.split('-').map(Number);
                      handleFilterChange('guests', guests);
                      handleFilterChange('rooms', rooms);
                    }}
                  >
                    <option value="1-1">1 Guest, 1 Room</option>
                    <option value="2-1">2 Guests, 1 Room</option>
                    <option value="3-1">3 Guests, 1 Room</option>
                    <option value="4-1">4 Guests, 1 Room</option>
                    <option value="4-2">4 Guests, 2 Rooms</option>
                    <option value="6-2">6 Guests, 2 Rooms</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Hotels in {searchFilters.destination || 'India'}
              </h1>
              <p className="text-gray-600">
                {searchFilters.checkIn && `${searchFilters.checkIn}${searchFilters.checkOut ? ` to ${searchFilters.checkOut}` : ''} · `}
                {searchFilters.guests} guest{searchFilters.guests > 1 ? 's' : ''} · {searchFilters.rooms} room{searchFilters.rooms > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`w-full lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range (per night)</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="500"
                    value={searchFilters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [searchFilters.priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{searchFilters.priceRange[0].toLocaleString()}</span>
                    <span>₹{searchFilters.priceRange[1].toLocaleString()}+</span>
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Property Type</h4>
                <div className="space-y-2">
                  {['hotel', 'resort', 'homestay', 'apartment', 'villa'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchFilters.propertyType.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...searchFilters.propertyType, type]
                            : searchFilters.propertyType.filter(t => t !== type);
                          handleFilterChange('propertyType', newTypes);
                        }}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
                <div className="space-y-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={searchFilters.rating === rating}
                        onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {rating === 0 ? 'Any rating' : `${rating}+ stars`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="space-y-2">
                  {[
                    'Free WiFi',
                    'Swimming Pool', 
                    'Spa & Wellness',
                    'Restaurant',
                    'Free Parking',
                    'Fitness Center',
                    'Room Service',
                    'Airport Shuttle'
                  ].map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchFilters.amenities.includes(amenity)}
                        onChange={(e) => {
                          const newAmenities = e.target.checked
                            ? [...searchFilters.amenities, amenity]
                            : searchFilters.amenities.filter(a => a !== amenity);
                          handleFilterChange('amenities', newAmenities);
                        }}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchFilters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {hotels.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                  <button
                    onClick={() => navigate('/hotels')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Hotels
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      {hotels.length} hotel{hotels.length > 1 ? 's' : ''} found
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {hotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/hotel/${hotel.id}`)}
                      >
                        {/* Hotel Image */}
                        <div className="relative h-64">
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Property Type Badge */}
                          <div className="absolute top-4 right-4">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                              {hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors">
                              <Heart className="h-4 w-4 text-gray-600" />
                            </button>
                            <button className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors">
                              <Share2 className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        {/* Hotel Content */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{hotel.name}</h3>
                              <div className="flex items-center text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="text-sm">{hotel.location}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{hotel.maxGuests} guests</span>
                                </div>
                                <div className="flex items-center">
                                  <Bed className="h-4 w-4 mr-1" />
                                  <span>{hotel.bedrooms} beds</span>
                                </div>
                                <div className="flex items-center">
                                  <Bath className="h-4 w-4 mr-1" />
                                  <span>{hotel.bathrooms} baths</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center mb-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium text-gray-900 ml-1">{hotel.rating.toFixed(1)}</span>
                              </div>
                              <div className="text-2xl font-bold text-gray-900">₹{hotel.price.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">per night</div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{hotel.description}</p>

                          {/* Amenities */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {hotel.amenities.slice(0, 4).map((amenity: string, index: number) => (
                                <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                  {getAmenityIcon(amenity)}
                                  <span>{amenity}</span>
                                </div>
                              ))}
                              {hotel.amenities.length > 4 && (
                                <span className="text-xs text-blue-600">+{hotel.amenities.length - 4} more</span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/hotel/${hotel.id}`);
                              }}
                              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookNow(hotel);
                              }}
                              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchResults;