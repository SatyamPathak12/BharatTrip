import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Star, MapPin, Wifi, Car, Coffee, Waves, Bed, Bath, Minus, Plus } from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { hotelService } from '../lib/hotelService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [displayedHotels, setDisplayedHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);

  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    children: 0,
    childrenAges: [] as number[],
    rooms: 1,
    pets: false
  });

  const totalGuests = searchData.guests + searchData.children;

  const updateGuestValue = (field: 'guests' | 'children' | 'rooms', delta: number) => {
    setSearchData(prev => {
      const newValue = Math.max(field === 'guests' ? 1 : field === 'rooms' ? 1 : 0, prev[field] + delta);
      if (field === 'children' && delta < 0) {
        return { ...prev, [field]: newValue, childrenAges: prev.childrenAges.slice(0, newValue) };
      }
      return { ...prev, [field]: newValue };
    });
  };

  const updateChildAge = (index: number, age: number) => {
    setSearchData(prev => {
      const newAges = [...prev.childrenAges];
      newAges[index] = age;
      return { ...prev, childrenAges: newAges };
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setIsGuestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAllHotels = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await hotelService.getAllApprovedHotels();
        if (result.success && result.hotels) {
          const transformedHotels = result.hotels.map(hotel => ({
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            price: hotel.price_per_night,
            rating: 4.0 + Math.random() * 0.9,
            images: hotel.images && hotel.images.length > 0 ? hotel.images : ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
            amenities: hotel.amenities || [],
            type: hotel.property_type,
            description: hotel.description,
            available: hotel.is_available,
            commission: Math.random() * 15 + 5,
            maxGuests: hotel.max_guests,
            bedrooms: hotel.bedrooms,
            bathrooms: hotel.bathrooms,
            owner: hotel.user?.name || 'Property Owner',
            featured: hotel.featured || false
          }));
          const sortedHotels = transformedHotels.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return b.commission - a.commission;
          });
          setAllHotels(sortedHotels);
          setDisplayedHotels(sortedHotels.slice(0, 8));
        } else {
          const mockHotels = getMockHotels();
          setAllHotels(mockHotels);
          setDisplayedHotels(mockHotels.slice(0, 8));
        }
      } catch (error) {
        const mockHotels = getMockHotels();
        setAllHotels(mockHotels);
        setDisplayedHotels(mockHotels.slice(0, 8));
      } finally {
        setLoading(false);
      }
    };
    fetchAllHotels();
  }, []);

  const getMockHotels = () => [
    { id: '1', name: 'Taj Palace Mumbai', location: 'Mumbai, Maharashtra', price: 8500, rating: 4.8, images: ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'], amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant'], type: 'hotel', description: 'Luxury hotel in the heart of Mumbai', available: true, commission: 18, maxGuests: 4, bedrooms: 2, bathrooms: 2, owner: 'Taj Hotels', featured: true },
    { id: '2', name: 'Goa Beach Resort', location: 'Goa', price: 6200, rating: 4.5, images: ['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'], amenities: ['Beach Access', 'Pool', 'Restaurant', 'Bar'], type: 'resort', description: 'Beachfront resort with stunning ocean views', available: true, commission: 15, maxGuests: 6, bedrooms: 3, bathrooms: 2, owner: 'Beach Resorts Ltd', featured: false },
    { id: '3', name: 'Kerala Homestay', location: 'Munnar, Kerala', price: 3500, rating: 4.3, images: ['https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg'], amenities: ['Kitchen Access', 'Garden', 'Mountain View'], type: 'homestay', description: 'Traditional Kerala home amidst tea plantations', available: true, commission: 12, maxGuests: 4, bedrooms: 2, bathrooms: 1, owner: 'Local Family', featured: false }
  ];

  const handleSearch = () => {
    if (!searchData.destination.trim()) { 
      alert('Please enter a destination'); 
      return; 
    }
    if (!searchData.checkIn || !searchData.checkOut) { 
      alert('Please select check-in and check-out dates'); 
      return; 
    }
    const searchParams = new URLSearchParams();
    searchParams.set('destination', searchData.destination);
    searchParams.set('checkIn', searchData.checkIn);
    searchParams.set('checkOut', searchData.checkOut);
    searchParams.set('guests', searchData.guests.toString());
    searchParams.set('rooms', searchData.rooms.toString());
    navigate(`/hotel-search?${searchParams.toString()}`);
  };

  const featuredDestinations = [
    { name: 'Mumbai', image: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg', properties: '1,200+ hotels' },
    { name: 'Goa', image: 'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg', properties: '800+ hotels' },
    { name: 'Kerala', image: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg', properties: '650+ hotels' },
    { name: 'Rajasthan', image: 'https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg', properties: '900+ hotels' }
  ];

  const hotelTypes = [
    { name: 'Hotels', icon: '🏨', description: 'Comfortable stays with modern amenities', count: allHotels.filter(h => h.type === 'hotel').length || '2,500+', filterValue: 'hotel' },
    { name: 'Resorts', icon: '🏖️', description: 'Luxury resorts with premium facilities', count: allHotels.filter(h => h.type === 'resort').length || '800+', filterValue: 'resort' },
    { name: 'Homestays', icon: '🏠', description: 'Authentic local experiences', count: allHotels.filter(h => h.type === 'homestay').length || '1,200+', filterValue: 'homestay' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg)',
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
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Where</label>
                  <div className="relative">
                    <MapPin className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 xs:h-5 xs:w-5" />
                    <input
                      type="text"
                      placeholder="Destination, hotel, landmark..."
                      className="w-full pl-8 xs:pl-10 pr-3 xs:pr-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm placeholder:text-xs xs:placeholder:text-sm"
                      value={searchData.destination}
                      onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                    />
                  </div>
                </div>

                {/* Check-in & Check-out */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <DatePicker
                    checkIn={searchData.checkIn}
                    checkOut={searchData.checkOut}
                    onCheckInChange={(date) => setSearchData({ ...searchData, checkIn: date })}
                    onCheckOutChange={(date) => setSearchData({ ...searchData, checkOut: date })}
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
                              searchData.pets ? 'bg-blue-600' : 'bg-gray-300'
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
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-lg xs:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 xs:hover:-translate-y-2"
              >
                <div
                  className="h-40 xs:h-48 sm:h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${destination.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-2 xs:left-3 sm:left-4 text-white px-1 xs:px-2">
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold">{destination.name}</h3>
                    <p className="text-xs xs:text-sm text-gray-200">{destination.properties}</p>
                  </div>
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

          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
            {hotelTypes.map((type, index) => (
              <div
                key={index}
                className="bg-white rounded-lg xs:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 xs:p-6 sm:p-8 text-center group cursor-pointer hover:-translate-y-1"
              >
                <div className="text-2xl xs:text-3xl sm:text-4xl mb-2 xs:mb-3 sm:mb-4">{type.icon}</div>
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-1 xs:mb-2">{type.name}</h3>
                <p className="text-xs xs:text-sm sm:text-base text-gray-600 mb-2 xs:mb-3 sm:mb-4 leading-relaxed">{type.description}</p>
                <div className="text-sm xs:text-base text-blue-600 font-semibold">{type.count} properties</div>
              </div>
            ))}
          </div>
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
          ) : displayedHotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedHotels.slice(0, 4).map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100"
                  onClick={() => {
                    if (user) {
                      navigate(`/booking/${property.id}`);
                    } else {
                      sessionStorage.setItem('redirectAfterLogin', `/booking/${property.id}`);
                      navigate('/login');
                    }
                  }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {property.featured && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                          FEATURED
                        </span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                        {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {property.name}
                    </h3>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{property.location}</span>
                    </div>

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
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-semibold text-gray-900">{property.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">(Excellent)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">₹{property.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">per night</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 3).map((amenity: string, amenityIndex: number) => (
                          <span key={amenityIndex} className="inline-block px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 font-medium">
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="inline-block px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600 font-medium">
                            +{property.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No properties available at the moment.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/search')}
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