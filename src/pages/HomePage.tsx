import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Star, MapPin, Wifi, Car, Coffee, Waves, Bed, Bath, Building2, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { hotelService } from '../lib/hotelService';
import { supabase } from '../lib/supabase';

// Add CSS for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateSearchFilters } = useBooking();
  const [featuredHotels, setFeaturedHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    children: 0,
    childrenAges: [] as number[],
    rooms: 1,
    pets: false,
  });
  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([]);
  const [heroBgUrl, setHeroBgUrl] = useState<string>('');
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const destinationDropdownRef = useRef<HTMLDivElement>(null);
  const propertyTypesRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setIsGuestDropdownOpen(false);
      }
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(event.target as Node)) {
        setIsDestinationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      setLoading(true);
      try {
        console.log('Fetching featured properties from properties table...');
        
        // Fetch properties where is_featured = true
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            name,
            location,
            price_per_night,
            images,
            amenities,
            property_type,
            description,
            is_available,
            max_guests,
            bedrooms,
            bathrooms,
            user:user_id (
              name
            )
          `)
          .eq('is_featured', true)
          .eq('is_available', true)
          .limit(4);

        if (error) {
          console.error('Error fetching featured properties:', error);
          setFeaturedHotels(getMockProperties());
          return;
        }

        if (data && data.length > 0) {
          // Transform database properties to match UI format
          const transformedHotels = data.map(hotel => ({
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
            commission: Math.random() * 15 + 5,
            maxGuests: hotel.max_guests,
            bedrooms: hotel.bedrooms,
            bathrooms: hotel.bathrooms,
            owner: hotel.user?.name || 'Property Owner'
          }));

          console.log(`Found ${transformedHotels.length} featured properties`);
          setFeaturedHotels(transformedHotels);
        } else {
          console.log('No featured properties found, using mock data');
          setFeaturedHotels(getMockProperties());
        }
      } catch (error) {
        console.error('Error fetching featured hotels:', error);
        setFeaturedHotels(getMockProperties());
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedHotels();
  }, []);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const { data, error } = await supabase
          .from('popular_destinations')
          .select('id, location_name, no_of_property, location_url');

        if (error) {
          console.error('Error fetching destinations:', error.message);
          return;
        }

        if (data) {
          const transformed = data.map((item) => ({
            id: item.id,
            name: item.location_name,
            image: item.location_url,
            properties: `${item.no_of_property}+ properties`,
          }));
          setFeaturedDestinations(transformed);
        }
      } catch (err) {
        console.error('Unexpected error fetching destinations:', err);
      }
    };

    fetchDestinations();
  }, []);

  // Fetch hero background image
  useEffect(() => {
    const fetchHeroBg = async () => {
      try {
        const { data, error } = await supabase
          .from("bg_image_url")
          .select("homePage_bg_url")
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching hero background:", error.message);
          return;
        }

        if (data && data.length > 0) {
          const url = data[0]?.homePage_bg_url;
          if (url) {
            console.log("Fetched BG URL:", url);
            setHeroBgUrl(url);
          } else {
            console.warn("No homePage_bg_url found in the latest row");
          }
        } else {
          console.warn("No rows returned from bg_image_url table");
        }
      } catch (err) {
        console.error("Unexpected error fetching hero background:", err);
      }
    };

    fetchHeroBg();
  }, []);

  // Fetch search history for the user
  useEffect(() => {
    const fetchSearchHistory = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('history')
          .select('id, search_content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching search history:', error);
          return;
        }

        if (data) {
          // Parse search content to extract destination
          const parsedHistory = data.map(item => {
            const destination = item.search_content.find((s: string) => s.startsWith('Destination:'))?.replace('Destination: ', '') || '';
            const checkIn = item.search_content.find((s: string) => s.startsWith('Check-in:'))?.replace('Check-in: ', '') || '';
            const checkOut = item.search_content.find((s: string) => s.startsWith('Check-out:'))?.replace('Check-out: ', '') || '';
            const adults = item.search_content.find((s: string) => s.startsWith('Adults:'))?.replace('Adults: ', '') || '1';
            const children = item.search_content.find((s: string) => s.startsWith('Children:'))?.replace('Children: ', '') || '0';
            const rooms = item.search_content.find((s: string) => s.startsWith('Rooms:'))?.replace('Rooms: ', '') || '1';
            
            return {
              id: item.id,
              destination,
              checkIn,
              checkOut,
              adults: parseInt(adults),
              children: parseInt(children),
              rooms: parseInt(rooms),
              created_at: item.created_at
            };
          });

          setSearchHistory(parsedHistory);
        }
      } catch (err) {
        console.error('Unexpected error fetching search history:', err);
      }
    };

    fetchSearchHistory();
  }, [user]);

  // Fetch property types dynamically
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('property_type')
          .eq('is_available', true);

        if (error) {
          console.error('Error fetching property types:', error);
          return;
        }

        if (data) {
          // Count properties by type
          const typeCounts: { [key: string]: number } = {};
          data.forEach(item => {
            const type = item.property_type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });

          // Transform to array with icons
          const typeIcons: { [key: string]: string } = {
            'hotel': '🏨',
            'resort': '🏖️',
            'homestay': '🏠',
            'villa': '🏡',
            'apartment': '🏢',
            'guesthouse': '🏘️',
            'cottage': '🛖',
            'hostel': '🏨',
            'lodge': '🏕️',
            'bungalow': '🏠'
          };

          const types = Object.entries(typeCounts).map(([type, count]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1) + 's',
            icon: typeIcons[type.toLowerCase()] || '🏠',
            count: `${count}+ ${count === 1 ? 'property' : 'properties'}`,
            type: type
          }));

          setPropertyTypes(types);
        }
      } catch (err) {
        console.error('Unexpected error fetching property types:', err);
      }
    };

    fetchPropertyTypes();
  }, []);

  const getMockProperties = () => [
    {
      id: '1',
      name: 'Taj Palace Mumbai',
      location: 'Mumbai, Maharashtra',
      price: 8500,
      rating: 4.5,
      images: ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
      type: 'hotel',
      description: 'Luxury hotel in the heart of Mumbai',
      available: true,
      commission: 18,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      owner: 'Taj Hotels'
    },
    {
      id: '2',
      name: 'Goa Beach Resort',
      location: 'Goa',
      price: 6500,
      rating: 4.2,
      images: ['https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg'],
      amenities: ['Beach Access', 'Pool', 'Restaurant', 'Water Sports'],
      type: 'resort',
      description: 'Beautiful beachfront resort in Goa',
      available: true,
      commission: 15,
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
      images: ['https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg'],
      amenities: ['Kitchen Access', 'Garden', 'Mountain View'],
      type: 'homestay',
      description: 'Traditional Kerala home amidst tea plantations',
      available: true,
      commission: 12,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      owner: 'Local Family'
    },
    {
      id: '4',
      name: 'Rajasthan Palace Hotel',
      location: 'Udaipur, Rajasthan',
      price: 12000,
      rating: 4.7,
      images: ['https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg'],
      amenities: ['Heritage Architecture', 'Royal Dining', 'Spa', 'Cultural Shows'],
      type: 'hotel',
      description: 'Historic palace hotel with royal heritage',
      available: true,
      commission: 20,
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3,
      owner: 'Royal Heritage Hotels'
    }
  ].sort((a, b) => b.commission - a.commission);

  const handleCheckInChange = (date: string) => {
    setSearchData(prev => {
      const newData = { ...prev, checkIn: date };
      
      if (prev.checkOut && new Date(prev.checkOut) <= new Date(date)) {
        newData.checkOut = '';
      }
      
      return newData;
    });
  };

  const handleCheckOutChange = (date: string) => {
    setSearchData(prev => {
      const newData = { ...prev, checkOut: date };
      
      if (prev.checkIn && new Date(prev.checkIn) >= new Date(date)) {
        newData.checkIn = '';
      }
      
      return newData;
    });
  };

  const updateGuestValue = (field: 'guests' | 'children' | 'rooms', delta: number) => {
    setSearchData(prev => {
      const newValue = Math.max(field === 'guests' || field === 'rooms' ? 1 : 0, prev[field] + delta);
      
      // If children count changes, update childrenAges array
      if (field === 'children') {
        const newChildrenAges = [...prev.childrenAges];
        if (delta > 0) {
          // Adding a child - add default age of 5
          newChildrenAges.push(5);
        } else if (delta < 0 && newChildrenAges.length > 0) {
          // Removing a child - remove last age
          newChildrenAges.pop();
        }
        return {
          ...prev,
          [field]: newValue,
          childrenAges: newChildrenAges
        };
      }
      
      return {
        ...prev,
        [field]: newValue
      };
    });
  };

  const updateChildAge = (index: number, age: number) => {
    setSearchData(prev => {
      const newChildrenAges = [...prev.childrenAges];
      newChildrenAges[index] = age;
      return {
        ...prev,
        childrenAges: newChildrenAges
      };
    });
  };

  const handleHistoryItemClick = (historyItem: any) => {
    setSearchData({
      destination: historyItem.destination,
      checkIn: historyItem.checkIn,
      checkOut: historyItem.checkOut,
      guests: historyItem.adults,
      children: historyItem.children,
      childrenAges: [],
      rooms: historyItem.rooms,
      pets: false,
    });
    setIsDestinationDropdownOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSearch = async () => {
    if (!searchData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }
    
    if (!searchData.checkIn || !searchData.checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    
    const totalGuests = searchData.guests + searchData.children;
    
    // Save search to history if user is logged in
    if (user?.id) {
      try {
        const searchContent = [
          `Destination: ${searchData.destination}`,
          `Check-in: ${searchData.checkIn}`,
          `Check-out: ${searchData.checkOut}`,
          `Adults: ${searchData.guests}`,
          `Children: ${searchData.children}`,
          searchData.children > 0 ? `Children Ages: ${searchData.childrenAges.join(', ')}` : '',
          `Rooms: ${searchData.rooms}`,
          `Pets: ${searchData.pets ? 'Yes' : 'No'}`,
        ].filter(item => item !== ''); // Remove empty strings

        const { error } = await supabase
          .from('history')
          .insert({
            user_id: user.id,
            search_content: searchContent
          });

        if (error) {
          console.error('Error saving search history:', error);
        } else {
          console.log('Search history saved successfully');
        }
      } catch (error) {
        console.error('Error saving search to history:', error);
      }
    }
    
    updateSearchFilters({ ...searchData, guests: totalGuests });
    
    const searchParams = new URLSearchParams();
    searchParams.set('destination', searchData.destination);
    searchParams.set('checkIn', searchData.checkIn);
    searchParams.set('checkOut', searchData.checkOut);
    searchParams.set('guests', totalGuests.toString());
    searchParams.set('rooms', searchData.rooms.toString());
    
    navigate(`/hotel-search?${searchParams.toString()}`);
  };

  const totalGuests = searchData.guests + searchData.children;

  const scrollPropertyTypes = (direction: 'left' | 'right') => {
    if (propertyTypesRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? propertyTypesRef.current.scrollLeft - scrollAmount
        : propertyTypesRef.current.scrollLeft + scrollAmount;
      
      propertyTypesRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Handle property type click - navigate to search with property type filter
  const handlePropertyTypeClick = (propertyType: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('propertyType', propertyType);
    navigate(`/hotel-search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <style>{scrollbarHideStyle}</style>
      {/* Hero Section */}
      <section 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroBgUrl})`,
        }}
      >
        <Header variant="hero" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-3 sm:px-4 max-w-4xl w-full">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 leading-tight">
              Discover Incredible India
            </h1>
            <p className="text-base xs:text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6 md:mb-8 text-gray-200 px-1 sm:px-2">
              Book unique accommodations and unforgettable experiences across India
            </p>

            {/* Search Form */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-3 xs:p-4 sm:p-6 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 items-end">
                {/* Destination */}
                <div className="relative sm:col-span-2 lg:col-span-1" ref={destinationDropdownRef}>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Where</label>
                  <div className="relative">
                    <MapPin className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 xs:h-5 xs:w-5 pointer-events-none z-10" />
                    <input
                      type="text"
                      placeholder="Destination, hotel, landmark..."
                      className="w-full pl-8 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm placeholder:text-xs xs:placeholder:text-sm"
                      value={searchData.destination}
                      onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                      onFocus={() => setIsDestinationDropdownOpen(true)}
                    />

                    {/* Recent Searches Dropdown */}
                  {isDestinationDropdownOpen && searchHistory.length > 0 && (
  <div className="absolute z-50 mt-2 w-[120%] left-[-10%] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
    <div className="px-4 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900">Recent Searches</h3>
    </div>
    <div className="py-2">
      {searchHistory.map((item) => (
        <div
          key={item.id}
          onClick={() => handleHistoryItemClick(item)}
          className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">
                  {item.destination}
                </span>
              </div>
              <div className="text-xs text-gray-600 ml-2">
                {(item.checkIn || item.checkOut) && " • "}
                <span>
                  {item.adults + item.children} Guest
                  {item.adults + item.children !== 1 ? "s" : ""}
                </span>
                {" • "}
                <span>
                  {item.rooms} Room{item.rooms !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

                  </div>
                </div>

                {/* Check-in */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <DatePicker
                    checkIn={searchData.checkIn}
                    checkOut={searchData.checkOut}
                    onCheckInChange={handleCheckInChange}
                    onCheckOutChange={handleCheckOutChange}
                  />
                </div>

                {/* Guests & Rooms */}
                <div ref={guestDropdownRef}>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Guests & Rooms</label>
                  <div className="relative">
                    <Users className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 xs:h-5 xs:w-5 pointer-events-none z-10" />
                    <button
                      type="button"
                      onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
                      className="w-full pl-8 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-left text-sm bg-white hover:bg-gray-50 transition-colors"
                    >
                      {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}, {searchData.rooms} Room{searchData.rooms !== 1 ? 's' : ''}
                    </button>

                    {/* Dropdown Panel */}
                    {isGuestDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                        {/* Adults */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <span className="text-gray-900 font-medium text-sm">Adults</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateGuestValue('guests', -1)}
                              disabled={searchData.guests <= 1}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <span className="text-gray-900 font-medium w-6 text-center">
                              {searchData.guests}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateGuestValue('guests', 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="h-4 w-4 text-blue-600" />
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-900 font-medium text-sm">Children</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => updateGuestValue('children', -1)}
                                disabled={searchData.children <= 0}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="h-4 w-4 text-gray-600" />
                              </button>
                              <span className="text-gray-900 font-medium w-6 text-center">
                                {searchData.children}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateGuestValue('children', 1)}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="h-4 w-4 text-blue-600" />
                              </button>
                            </div>
                          </div>

                          {/* Age Selectors for Children */}
                          {searchData.children > 0 && (
                            <div className="mt-3 space-y-2">
                              {Array.from({ length: searchData.children }).map((_, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                  <span className="text-sm text-gray-700">Child {index + 1} age</span>
                                  <select
                                    value={searchData.childrenAges[index] || 5}
                                    onChange={(e) => updateChildAge(index, Number(e.target.value))}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                  >
                                    {Array.from({ length: 15 }, (_, i) => i + 1).map((age) => (
                                      <option key={age} value={age}>
                                        {age} {age === 1 ? 'year' : 'years'}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                              <p className="text-xs text-gray-600 mt-2">
                                To find you a place to stay that fits your entire group along with correct prices, we need to know how old your child will be at check-out
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Rooms */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <span className="text-gray-900 font-medium text-sm">Rooms</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateGuestValue('rooms', -1)}
                              disabled={searchData.rooms <= 1}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <span className="text-gray-900 font-medium w-6 text-center">
                              {searchData.rooms}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateGuestValue('rooms', 1)}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="h-4 w-4 text-blue-600" />
                            </button>
                          </div>
                        </div>

                        {/* Pets Toggle */}
                        <div className="flex items-center justify-between py-3">
                          <span className="text-gray-900 text-sm">Travelling with pets?</span>
                          <button
                            type="button"
                            onClick={() => setSearchData(prev => ({ ...prev, pets: !prev.pets }))}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              searchData.pets ? 'bg-gray-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                searchData.pets ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Info Text */}
                        <div className="mt-2 mb-3">
                          <p className="text-xs text-gray-600">
                            Assistance animals aren't considered pets.
                          </p>
                          <a href="#" className="text-xs text-blue-600 hover:underline">
                            Read more about travelling with assistance animals
                          </a>
                        </div>

                        {/* Done Button */}
                        <button
                          type="button"
                          onClick={() => setIsGuestDropdownOpen(false)}
                          className="w-full py-2.5 text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Button */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full bg-blue-600 text-white py-2 xs:py-3 px-3 xs:px-4 sm:px-8 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-1 xs:space-x-2 text-sm xs:text-base"
                  >
                    <Search className="h-4 w-4 xs:h-5 xs:w-5" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-8 xs:py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 xs:mb-8 sm:mb-12">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4">
              Popular Destinations
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-gray-600 px-2">
              Explore the most loved destinations across India
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
            {featuredDestinations.map((destination, index) => (
              <div
                key={destination.id}
                onClick={() => {
                  setSearchData({ ...searchData, destination: destination.name });
                  const searchParams = new URLSearchParams();
                  searchParams.set('destination', destination.name);
                  navigate(`/hotel-search?${searchParams.toString()}`);
                }}
                className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white border border-gray-100"
              >
                {/* Image Container with Overlay */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Decorative Corner Element */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-2 border border-white/30">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Property Count Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {destination.properties}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="transform group-hover:translate-y-0 transition-transform duration-500">
                    {/* Destination Name */}
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                      {destination.name}
                    </h3>
                    
                    {/* Call to Action */}
                    <div className="flex items-center text-white/90 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span>Explore Now</span>
                      <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>

                {/* Hover Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-8 xs:py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 xs:mb-8 sm:mb-12">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4">
              Browse by Property Type
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-gray-600 px-2">
              Find the perfect accommodation for your travel style
            </p>
          </div>

          {propertyTypes.length > 0 ? (
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => scrollPropertyTypes('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 xs:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 -ml-2 xs:-ml-4"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5 xs:h-6 xs:w-6 text-gray-700" />
              </button>

              {/* Scrollable Container */}
              <div
                ref={propertyTypesRef}
                className="flex gap-4 xs:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-8 xs:px-12"
              >
                {propertyTypes.map((type, index) => (
                  <div
                    key={index}
                    onClick={() => handlePropertyTypeClick(type.type)}
                    className="flex-shrink-0 w-64 xs:w-72 bg-white rounded-lg xs:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 xs:p-6 sm:p-8 text-center group cursor-pointer hover:-translate-y-1"
                  >
                    <div className="text-3xl xs:text-4xl sm:text-5xl mb-2 xs:mb-3 sm:mb-4">{type.icon}</div>
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-1 xs:mb-2">{type.name}</h3>
                    <div className="text-sm xs:text-base text-blue-600 font-semibold">{type.count}</div>
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => scrollPropertyTypes('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 xs:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50 -mr-2 xs:-mr-4"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5 xs:h-6 xs:w-6 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading property types...</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-8 xs:py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 xs:mb-8 sm:mb-12">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4">
              Featured Properties
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-gray-600 px-2">
              Handpicked premium accommodations with the best value
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading featured properties...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {featuredHotels.slice(0, 4).map((property, index) => (
    <div
      key={property.id}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100"
      onClick={() => {
        navigate(`/hotel-details/${property.id}`, {
          state: {
            checkIn: searchData.checkIn,
            checkOut: searchData.checkOut,
            guests: searchData.guests + searchData.children,
            rooms: searchData.rooms,
          },
        });
      }}
    >
     {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Featured Badge - Top Left */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            <Star className="h-3 w-3 fill-current" />
            <span>FEATURED</span>
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
            {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Hotel Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm">{property.location}</span>
        </div>

        {/* Details Row */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span className="font-medium">{property.maxGuests}</span>
          </div>
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span className="font-medium">{property.bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span className="font-medium">{property.bathrooms}</span>
          </div>
        </div>

        {/* Rating & Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
            <span className="text-sm font-semibold text-gray-900">
              {property.rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 ml-1">(Excellent)</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              ₹{property.price.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">per night</div>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map(
              (amenity: string, amenityIndex: number) => (
                <span
                  key={amenityIndex}
                  className="inline-block px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 font-medium"
                >
                  {amenity}
                </span>
              )
            )}
            {property.amenities.length > 3 && (
              <span className="inline-block px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 font-medium">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

{/* Action Buttons (Styled like Book Now in second block) */}
                       <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Navigating to hotel details with ID:', property.id);
                              navigate(`/hotel-details/${property.id}`, {
                                state: {
                                  property: property, // Pass the full property object
                                  checkIn: searchData.checkIn,
                                  checkOut: searchData.checkOut,
                                  guests: searchData.guests + searchData.children,
                                  rooms: searchData.rooms,
                                },
                              });
                            }}
                            className="w-1/2 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            View Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const totalGuests = searchData.guests + searchData.children;
                              console.log('Book Now clicked for property:', property.id);

                              if (user) {
                                navigate(`/hotel-booking/${property.id}`, {
                                  state: {
                                    property: property, // Pass the full property object
                                    checkIn: searchData.checkIn || '',
                                    checkOut: searchData.checkOut || '',
                                    guests: totalGuests,
                                    rooms: searchData.rooms,
                                  },
                                });
                              } else {
                                sessionStorage.setItem(
                                  'redirectAfterLogin',
                                  `/hotel-booking/${property.id}`
                                );
                                sessionStorage.setItem(
                                  'bookingData',
                                  JSON.stringify({
                                    property: property, // Store the full property object
                                    checkIn: searchData.checkIn || '',
                                    checkOut: searchData.checkOut || '',
                                    guests: totalGuests,
                                    rooms: searchData.rooms,
                                  })
                                );
                                navigate('/login');
                              }
                            }}
                            className="w-1/2 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            Book Now
                          </button>
                        </div>
      </div>
    </div>
  ))}
</div>

          )}
          
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/hotel-search')}
              className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View All Properties
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose BharatTrips */}
      <section className="py-8 xs:py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 xs:mb-8 sm:mb-12">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4">
              Why Choose BharatTrips?
            </h2>
            <p className="text-sm xs:text-base sm:text-lg text-gray-600 px-2">
              Experience the best of India with our trusted platform
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6 sm:gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 xs:p-4 w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center">
                <Star className="h-6 w-6 xs:h-8 xs:w-8 text-blue-600" />
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-1 xs:mb-2">Best Price Guarantee</h3>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed px-1">Find the lowest prices or we'll match them</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-3 xs:p-4 w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center">
                <Wifi className="h-6 w-6 xs:h-8 xs:w-8 text-orange-600" />
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-1 xs:mb-2">Free Cancellation</h3>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed px-1">Cancel most bookings free of charge</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 xs:p-4 w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center">
                <Car className="h-6 w-6 xs:h-8 xs:w-8 text-green-600" />
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-1 xs:mb-2">24/7 Support</h3>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed px-1">Customer service available round the clock</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 xs:p-4 w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center">
                <Coffee className="h-6 w-6 xs:h-8 xs:w-8 text-purple-600" />
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 mb-1 xs:mb-2">Local Experiences</h3>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed px-1">Authentic Indian hospitality everywhere</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;