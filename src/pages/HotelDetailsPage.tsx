import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Coffee, 
  Waves, 
  Calendar,
  Clock,
  CreditCard,
  Shield,
  CheckCircle,
  Heart,
  Share2,
  Phone,
  Mail,
  User,
  Award,
  ThumbsUp,
  Camera,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useAuth } from '../context/AuthContext';
import { hotelService } from '../lib/hotelService';
import { format } from 'date-fns';

const HotelDetailsPage: React.FC = () => {
  const { hotelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1
  });

  useEffect(() => {
    const loadHotel = async () => {
      if (!hotelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching hotel details for ID:', hotelId);
        const result = await hotelService.getHotelById(hotelId);
        
        if (result.success && result.hotel) {
          setHotel(result.hotel);
        } else {
          console.error('Failed to fetch hotel:', result.error);
          // Use mock data as fallback
          const mockHotel = getMockHotelById(hotelId);
          if (mockHotel) {
            setHotel(mockHotel);
          } else {
            setError('Hotel not found');
          }
        }
      } catch (err) {
        console.error('Error fetching hotel from database:', err);
        // Use mock data as fallback
        const mockHotel = getMockHotelById(hotelId);
        if (mockHotel) {
          setHotel(mockHotel);
        } else {
          setError('Failed to load hotel details');
        }
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [hotelId]);

  const getMockHotelById = (id: string) => {
    const mockHotels = [
      {
        id: '1',
        name: 'Taj Palace Mumbai',
        description: 'Experience luxury at its finest in the heart of Mumbai. This iconic hotel offers world-class amenities, exceptional service, and breathtaking views of the Arabian Sea.',
        location: 'Mumbai, Maharashtra',
        address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
        property_type: 'hotel',
        price_per_night: 8500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 2,
        amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Restaurant', 'Fitness Center', 'Room Service', 'Concierge', 'Valet Parking'],
        images: [
          'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg',
          'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
          'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg'
        ],
        contact_name: 'Hotel Manager',
        contact_email: 'manager@tajpalace.com',
        contact_phone: '+91 22 6665 3366',
        status: 'approved',
        is_active: true,
        is_available: true,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        user: {
          name: 'Taj Hotels',
          email: 'contact@tajhotels.com'
        }
      },
      {
        id: '2',
        name: 'Goa Beach Resort',
        description: 'Escape to paradise at this stunning beachfront resort. Enjoy pristine beaches, crystal-clear waters, and world-class hospitality in the heart of Goa.',
        location: 'Goa',
        address: 'Calangute Beach, North Goa, Goa 403516',
        property_type: 'resort',
        price_per_night: 6200,
        max_guests: 6,
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Bar/Lounge', 'Water Sports', 'Spa', 'Free WiFi', 'Airport Shuttle'],
        images: [
          'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
          'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg',
          'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg'
        ],
        contact_name: 'Resort Manager',
        contact_email: 'manager@goabeach.com',
        contact_phone: '+91 832 227 8800',
        status: 'approved',
        is_active: true,
        is_available: true,
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z',
        user: {
          name: 'Beach Resorts Ltd',
          email: 'contact@beachresorts.com'
        }
      },
      {
        id: '3',
        name: 'Kerala Homestay',
        description: 'Immerse yourself in authentic Kerala culture at this traditional homestay nestled among lush tea plantations. Experience warm hospitality and breathtaking mountain views.',
        location: 'Munnar, Kerala',
        address: 'Tea Garden Road, Munnar, Kerala 685612',
        property_type: 'homestay',
        price_per_night: 3500,
        max_guests: 4,
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['Kitchen Access', 'Garden', 'Mountain View', 'Free WiFi', 'Traditional Meals', 'Nature Walks'],
        images: [
          'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
          'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
          'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg'
        ],
        contact_name: 'Local Host',
        contact_email: 'host@keralahome.com',
        contact_phone: '+91 486 523 1234',
        status: 'approved',
        is_active: true,
        is_available: true,
        created_at: '2024-01-25T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z',
        user: {
          name: 'Local Family',
          email: 'family@keralahome.com'
        }
      }
    ];

    return mockHotels.find(h => h.id === id);
  };

  const handleBookNow = () => {
    if (user) {
      navigate(`/hotel-booking/${hotelId}`);
    } else {
      sessionStorage.setItem('redirectAfterLogin', `/hotel-booking/${hotelId}`);
      navigate('/login');
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Free WiFi': <Wifi className="h-5 w-5" />,
      'Swimming Pool': <Waves className="h-5 w-5" />,
      'Restaurant': <Coffee className="h-5 w-5" />,
      'Free Parking': <Car className="h-5 w-5" />,
      'Spa & Wellness': <Award className="h-5 w-5" />,
      'Fitness Center': <Award className="h-5 w-5" />,
      'Room Service': <Coffee className="h-5 w-5" />,
      'Beach Access': <Waves className="h-5 w-5" />,
      'Bar/Lounge': <Coffee className="h-5 w-5" />,
      'Water Sports': <Waves className="h-5 w-5" />,
      'Kitchen Access': <Coffee className="h-5 w-5" />,
      'Garden': <Award className="h-5 w-5" />,
      'Mountain View': <Award className="h-5 w-5" />
    };
    return iconMap[amenity] || <Star className="h-5 w-5" />;
  };

  const mockRooms = [
    {
      id: 1,
      name: 'Deluxe Room',
      size: '25 sqm',
      beds: '1 King Bed',
      guests: 2,
      price: hotel?.price_per_night || 5000,
      originalPrice: (hotel?.price_per_night || 5000) + 1000,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar'],
      images: [hotel?.images?.[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true,
      badge: 'Popular'
    },
    {
      id: 2,
      name: 'Superior Room',
      size: '30 sqm',
      beds: '1 King Bed',
      guests: 2,
      price: (hotel?.price_per_night || 5000) + 1500,
      originalPrice: (hotel?.price_per_night || 5000) + 2500,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Balcony'],
      images: [hotel?.images?.[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true,
      badge: 'Premium'
    },
    {
      id: 3,
      name: 'Executive Suite',
      size: '45 sqm',
      beds: '1 King Bed + Sofa Bed',
      guests: 4,
      price: (hotel?.price_per_night || 5000) + 3000,
      originalPrice: (hotel?.price_per_night || 5000) + 4000,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Balcony', 'Living Area', 'Executive Lounge'],
      images: [hotel?.images?.[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true,
      badge: 'Luxury'
    }
  ];

  const mockReviews = [
    {
      id: 1,
      user: 'Priya Sharma',
      rating: 5,
      date: '2024-01-15',
      comment: 'Absolutely amazing stay! The staff was incredibly helpful and the rooms were spotless. The location is perfect for exploring the city.',
      helpful: 12
    },
    {
      id: 2,
      user: 'Rajesh Kumar',
      rating: 4,
      date: '2024-01-10',
      comment: 'Great hotel with excellent amenities. The breakfast was delicious and the pool area was very relaxing. Highly recommend!',
      helpful: 8
    },
    {
      id: 3,
      user: 'Sarah Johnson',
      rating: 5,
      date: '2024-01-05',
      comment: 'Perfect for a romantic getaway. The sunset views from our room were breathtaking. Will definitely come back!',
      helpful: 15
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotel details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel not found</h2>
            <p className="text-gray-600 mb-6">{error || 'The hotel you are looking for does not exist.'}</p>
            <button 
              onClick={() => navigate('/hotel-search')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to search
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nights = bookingData.checkIn && bookingData.checkOut 
    ? Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header variant="page" />
      
      {/* Hero Section */}
      <div className="pt-16 relative">
        <div className="relative h-96 overflow-hidden">
          <img
            src={hotel.images[currentImageIndex]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-300 shadow-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Gallery Button */}
          <button
            onClick={() => setShowImageGallery(true)}
            className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg flex items-center space-x-2"
          >
            <Camera className="h-4 w-4" />
            <span className="text-sm font-medium">{hotel.images.length} Photos</span>
          </button>

          {/* Hotel Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{hotel.name}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="text-lg">{hotel.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="text-lg font-semibold">4.8</span>
                      <span className="text-sm ml-1">(324 reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Up to {hotel.max_guests} guests</span>
                    </div>
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{hotel.bedrooms} bedroom{hotel.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{hotel.bathrooms} bathroom{hotel.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">₹{hotel.price_per_night.toLocaleString()}</div>
                  <div className="text-lg text-gray-200">per night</div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Navigation */}
          {hotel.images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : hotel.images.length - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex < hotel.images.length - 1 ? currentImageIndex + 1 : 0)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Navigation Tabs */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-2">
              <div className="flex space-x-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Building2 },
                  { id: 'rooms', label: 'Rooms', icon: Bed },
                  { id: 'amenities', label: 'Amenities', icon: Star },
                  { id: 'reviews', label: 'Reviews', icon: ThumbsUp },
                  { id: 'location', label: 'Location', icon: MapPin }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">About this property</h2>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">{hotel.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Property Highlights</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Prime location in {hotel.location}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Professional housekeeping</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">24/7 customer support</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Verified property owner</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Host Information</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{hotel.user?.name || 'Property Owner'}</p>
                        <p className="text-sm text-gray-600">Verified Host</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{hotel.contact_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{hotel.contact_email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {mockRooms.map((room) => (
                      <div key={room.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Room Image */}
                            <div className="lg:w-64">
                              <div className="relative">
                                <img
                                  src={room.images[0]}
                                  alt={room.name}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                {room.badge && (
                                  <div className="absolute top-3 left-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      room.badge === 'Popular' ? 'bg-green-500 text-white' :
                                      room.badge === 'Premium' ? 'bg-blue-500 text-white' :
                                      'bg-purple-500 text-white'
                                    }`}>
                                      {room.badge}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Room Details */}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center">
                                      <Building2 className="h-4 w-4 mr-1" />
                                      <span>{room.size}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Bed className="h-4 w-4 mr-1" />
                                      <span>{room.beds}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-1" />
                                      <span>Up to {room.guests} guests</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500 line-through">₹{room.originalPrice.toLocaleString()}</div>
                                  <div className="text-2xl font-bold text-gray-900">₹{room.price.toLocaleString()}</div>
                                  <div className="text-sm text-gray-600">per night</div>
                                </div>
                              </div>

                              {/* Amenities */}
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {room.amenities.map((amenity, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Benefits */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span>{room.cancellation}</span>
                                </div>
                                {room.breakfast && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    <span>Breakfast included</span>
                                  </div>
                                )}
                              </div>

                              {/* Select Button */}
                              <button
                                onClick={handleBookNow}
                                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                Select Room - ₹{(room.price * nights).toLocaleString()} total
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Amenities & Services</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-300">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="font-medium text-gray-900">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Guest Reviews</h2>
                </div>
                
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.user}</h4>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-gray-600 ml-2">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>
                          <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Location & Nearby</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                    <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{hotel.address}</p>
                        <p className="text-sm text-gray-600">{hotel.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Attractions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'City Center', distance: '2.5 km', time: '5 min drive' },
                        { name: 'Airport', distance: '15 km', time: '25 min drive' },
                        { name: 'Railway Station', distance: '3 km', time: '8 min drive' },
                        { name: 'Shopping Mall', distance: '1.2 km', time: '3 min walk' }
                      ].map((attraction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{attraction.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{attraction.distance}</div>
                            <div className="text-xs text-gray-600">{attraction.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 sticky top-24">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900">Book Your Stay</h3>
              </div>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹{hotel.price_per_night.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">per night</div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <DatePicker
                  checkIn={bookingData.checkIn}
                  checkOut={bookingData.checkOut}
                  onCheckInChange={(date) => setBookingData({ ...bookingData, checkIn: date })}
                  onCheckOutChange={(date) => setBookingData({ ...bookingData, checkOut: date })}
                />
              </div>

              {/* Guests & Rooms */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Guests & Rooms</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none bg-white/50 backdrop-blur-sm"
                    value={`${bookingData.guests}-${bookingData.rooms}`}
                    onChange={(e) => {
                      const [guests, rooms] = e.target.value.split('-').map(Number);
                      setBookingData({ ...bookingData, guests, rooms });
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

              {/* Price Breakdown */}
              {bookingData.checkIn && bookingData.checkOut && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">₹{hotel.price_per_night.toLocaleString()} × {nights} nights</span>
                      <span className="font-medium text-gray-900">₹{(hotel.price_per_night * nights).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium text-gray-900">₹{Math.round(hotel.price_per_night * nights * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium text-gray-900">₹{Math.round(hotel.price_per_night * nights * 0.18).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-orange-500">₹{Math.round(hotel.price_per_night * nights * 1.23).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                onClick={handleBookNow}
                disabled={!bookingData.checkIn || !bookingData.checkOut}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {bookingData.checkIn && bookingData.checkOut ? 'Book Now' : 'Select Dates to Book'}
              </button>

              {/* Security Notice */}
              <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-2" />
                <span>Secure booking guaranteed</span>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{hotel.contact_phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{hotel.contact_email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageGallery(false)}
              className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="relative w-full max-w-4xl mx-auto px-4">
              <img
                src={hotel.images[currentImageIndex]}
                alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              
              {hotel.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : hotel.images.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex < hotel.images.length - 1 ? currentImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {hotel.images.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetailsPage;