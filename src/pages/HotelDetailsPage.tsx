import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Building2,
  Plus,
  Minus
} from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useAuth } from '../context/AuthContext';
import { hotelService } from '../lib/hotelService';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const HotelDetailsPage: React.FC = () => {
  const { hotelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const guestDropdownRef = useRef<HTMLDivElement>(null);

  // Get booking data from navigation state if available
  const stateData = location.state as any;
  
  const [bookingData, setBookingData] = useState({
    checkIn: stateData?.checkIn || '',
    checkOut: stateData?.checkOut || '',
    guests: stateData?.guests || 2,
    children: 0,
    childrenAges: [] as number[],
    rooms: stateData?.rooms || 1,
    pets: false
  });

  // Calculate total guests
   const totalGuests = bookingData.guests + bookingData.children;


const NearbyAttractions: React.FC<NearbyAttractionsProps> = ({ propertyId }) => {
  const [nearbyAttractions, setNearbyAttractions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNearbyAttractions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("properties")
          .select("id, nearby_attractions") // include id for debugging
          .eq("id", propertyId)
          .single();

        console.log("Fetched data:", data); // ✅ Check what’s coming from Supabase
        console.log("Property ID used:", propertyId);

        if (error) throw error;

        if (data && Array.isArray(data.nearby_attractions)) {
          setNearbyAttractions(data.nearby_attractions);
        } else {
          console.warn("No nearby_attractions found or not an array");
          setNearbyAttractions([]);
        }
      } catch (err) {
        console.error("Error fetching nearby attractions:", err);
        setNearbyAttractions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyAttractions();
  }, [propertyId]);

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading nearby attractions...</p>;
  }

  if (nearbyAttractions.length === 0) {
    return <p className="text-gray-500 text-sm">No nearby attractions available.</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Attractions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nearbyAttractions.map((attraction, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="font-medium text-gray-900">{attraction}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


 // Helper function to get beds summary
  const getBedsSummary = (beds: any[]) => {
    if (!beds || !Array.isArray(beds)) return { description: '', totalBeds: 0, guestCapacity: 0 };
    
    const bedTypes: string[] = [];
    let totalBeds = 0;
    let guestCapacity = 0;
    
    beds.forEach((bed: any) => {
      if (bed.count > 0) {
        totalBeds += bed.count;
        bedTypes.push(`${bed.count} ${bed.type}${bed.count > 1 ? 's' : ''}`);
        
        // Estimate guest capacity based on bed type
        if (bed.type.includes('Single')) {
          guestCapacity += bed.count * 1;
        } else if (bed.type.includes('Double') || bed.type.includes('Large') || bed.type.includes('King')) {
          guestCapacity += bed.count * 2;
        } else if (bed.type.includes('Sofa') || bed.type.includes('Futon')) {
          guestCapacity += bed.count * 1;
        } else if (bed.type.includes('Bunk')) {
          guestCapacity += bed.count * 2;
        } else {
          guestCapacity += bed.count * 2; // Default to 2 guests
        }
      }
    });
    
    return {
      description: bedTypes.join(', ') || 'No beds configured',
      totalBeds,
      guestCapacity
    };
  };

  // Parse bed configuration from hotel data
  const getBedConfigurationRooms = () => {
    if (!hotel?.bed_configuration) return [];
    
    const bedConfig = hotel.bed_configuration;
    const rooms = [];
    
    // Process bedrooms
    if (bedConfig.bedrooms && Array.isArray(bedConfig.bedrooms)) {
      bedConfig.bedrooms.forEach((bedroom: any, index: number) => {
        const bedsInfo = getBedsSummary(bedroom.beds);
          rooms.push({
            id: `bedroom-${index}`,
            name: bedroom.name || `Bedroom ${index + 1}`,
            type: 'bedroom',
            beds: bedroom.beds,
            bedsDescription: bedsInfo.description,
            totalBeds: bedsInfo.totalBeds,
            guests: bedsInfo.guestCapacity,
            size: hotel.property_size || 'Standard size',
            price: hotel.price_per_night,
            originalPrice: Math.round(hotel.price_per_night * 1.15),
            amenities: hotel.amenities?.slice(0, 5) || [],
            images: hotel.images || ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
            cancellation: hotel.cancellation_policy || 'Free cancellation until 24 hours before check-in',
            breakfast: true,
            badge: index === 0 ? 'Popular' : index === 1 ? 'Premium' : null
          });
        
      });
    }
    
    // Process living room if it has beds
    if (bedConfig.living_room?.beds) {
      const bedsInfo = getBedsSummary(bedConfig.living_room.beds);
      if (bedsInfo.totalBeds > 0) {
        rooms.push({
          id: 'living-room',
          name: 'Living Room',
          type: 'living_room',
          beds: bedConfig.living_room.beds,
          bedsDescription: bedsInfo.description,
          totalBeds: bedsInfo.totalBeds,
          guests: bedsInfo.guestCapacity,
          size: hotel.property_size || 'Standard size',
          price: Math.round(hotel.price_per_night * 0.8),
          originalPrice: hotel.price_per_night,
          amenities: hotel.amenities?.slice(0, 4) || [],
          images: hotel.images || ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
          cancellation: hotel.cancellation_policy || 'Free cancellation until 24 hours before check-in',
          breakfast: true,
          badge: null
        });
      }
    }
    
    // Process other spaces
    if (bedConfig.other_spaces && Array.isArray(bedConfig.other_spaces)) {
      bedConfig.other_spaces.forEach((space: any, index: number) => {
        const bedsInfo = getBedsSummary(space.beds);
        if (bedsInfo.totalBeds > 0) {
          rooms.push({
            id: `other-space-${index}`,
            name: space.name || `Other Space ${index + 1}`,
            type: 'other_space',
            beds: space.beds,
            bedsDescription: bedsInfo.description,
            totalBeds: bedsInfo.totalBeds,
            guests: bedsInfo.guestCapacity,
            size: hotel.property_size || 'Standard size',
            price: Math.round(hotel.price_per_night * 0.7),
            originalPrice: Math.round(hotel.price_per_night * 0.85),
            amenities: hotel.amenities?.slice(0, 3) || [],
            images: hotel.images || ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
            cancellation: hotel.cancellation_policy || 'Free cancellation until 24 hours before check-in',
            breakfast: false,
            badge: null
          });
        }
      });
    }
    
    return rooms;
  };

  const propertyRooms = getBedConfigurationRooms();

  // Update guest values
  const updateGuestValue = (field: 'guests' | 'children' | 'rooms', delta: number) => {
    setBookingData(prev => {
      const newValue = Math.max(field === 'guests' ? 1 : field === 'rooms' ? 1 : 0, prev[field] + delta);
      
      // If reducing children, also reduce childrenAges array
      if (field === 'children' && delta < 0) {
        return {
          ...prev,
          [field]: newValue,
          childrenAges: prev.childrenAges.slice(0, newValue)
        };
      }
      
      return {
        ...prev,
        [field]: newValue
      };
    });
  };

  // Update child age
  const updateChildAge = (index: number, age: number) => {
    setBookingData(prev => {
      const newAges = [...prev.childrenAges];
      newAges[index] = age;
      return {
        ...prev,
        childrenAges: newAges
      };
    });
  };

  // Close dropdown when clicking outside
useEffect(() => {
  const loadHotel = async () => {
    if (!hotelId) return;
    
    // First, check if property data was passed via navigation state
    const propertyFromState = location.state?.property;
    
    if (propertyFromState) {
      console.log('Using property data from navigation state:', propertyFromState);
      
      // Transform the state property to match expected format
      const transformedHotel = {
        id: propertyFromState.id,
        name: propertyFromState.name,
        description: propertyFromState.description || 'Beautiful property with excellent amenities',
        location: propertyFromState.location,
        address: propertyFromState.address || propertyFromState.location,
        property_type: propertyFromState.type || propertyFromState.property_type,
        price_per_night: propertyFromState.price || propertyFromState.price_per_night,
        max_guests: propertyFromState.maxGuests || propertyFromState.max_guests,
        bedrooms: propertyFromState.bedrooms,
        bathrooms: propertyFromState.bathrooms,
        amenities: propertyFromState.amenities || [],
        images: propertyFromState.images && propertyFromState.images.length > 0 
          ? propertyFromState.images 
          : ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
        contact_phone: propertyFromState.contact_phone || 'Not available',
        contact_email: propertyFromState.contact_email || 'Not available',
        rating: propertyFromState.rating || 4.5,
        review_count: propertyFromState.review_count || 0,
        user: propertyFromState.user || { 
          name: propertyFromState.owner || 'Property Owner', 
          email: 'contact@property.com' 
        },
        bed_configuration: propertyFromState.bed_configuration,
        property_size: propertyFromState.property_size,
        cancellation_policy: propertyFromState.cancellation_policy || 'Free cancellation until 24 hours before check-in',
        nearby_attractions: propertyFromState.nearby_attractions
      };
      
      setHotel(transformedHotel);
      setLoading(false);
      return; // Exit early since we have the data
    }
    
    // If no state data, fetch from database
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching hotel details from database for ID:', hotelId);
      const result = await hotelService.getHotelById(hotelId);
      
      if (result.success && result.hotel) {
        // Transform the hotel data to match the expected format
        const transformedHotel = {
          ...result.hotel,
          images: result.hotel.images && result.hotel.images.length > 0 
            ? result.hotel.images 
            : ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
          amenities: result.hotel.amenities || [],
          contact_phone: result.hotel.contact_phone || 'Not available',
          contact_email: result.hotel.contact_email || 'Not available',
          address: result.hotel.address || result.hotel.location,
          user: result.hotel.user || { name: 'Property Owner', email: 'contact@property.com' }
        };
        setHotel(transformedHotel);
      } else {
        console.error('Failed to fetch hotel:', result.error);
        setError('Hotel not found. Please try another property.');
      }
    } catch (err) {
      console.error('Error fetching hotel from database:', err);
      setError('Failed to load hotel details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  loadHotel();
}, [hotelId, location.state]);

  // const getMockHotelById = (id: string) => {
  //   const mockHotels = [
  //     {
  //       id: '1',
  //       name: 'Taj Palace Mumbai',
  //       description: 'Experience luxury at its finest in the heart of Mumbai. This iconic hotel offers world-class amenities, exceptional service, and breathtaking views of the Arabian Sea.',
  //       location: 'Mumbai, Maharashtra',
  //       address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
  //       property_type: 'hotel',
  //       price_per_night: 8500,
  //       max_guests: 4,
  //       bedrooms: 2,
  //       bathrooms: 2,
  //       amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Restaurant', 'Fitness Center', 'Room Service', 'Concierge', 'Valet Parking'],
  //       images: [
  //         'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg',
  //         'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
  //         'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg'
  //       ],
  //       contact_name: 'Hotel Manager',
  //       contact_email: 'manager@tajpalace.com',
  //       contact_phone: '+91 22 6665 3366',
  //       status: 'approved',
  //       is_active: true,
  //       is_available: true,
  //       created_at: '2024-01-15T00:00:00Z',
  //       updated_at: '2024-01-15T00:00:00Z',
  //       user: {
  //         name: 'Taj Hotels',
  //         email: 'contact@tajhotels.com'
  //       }
  //     },
  //     {
  //       id: '2',
  //       name: 'Goa Beach Resort',
  //       description: 'Escape to paradise at this stunning beachfront resort. Enjoy pristine beaches, crystal-clear waters, and world-class hospitality in the heart of Goa.',
  //       location: 'Goa',
  //       address: 'Calangute Beach, North Goa, Goa 403516',
  //       property_type: 'resort',
  //       price_per_night: 6200,
  //       max_guests: 6,
  //       bedrooms: 3,
  //       bathrooms: 2,
  //       amenities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Bar/Lounge', 'Water Sports', 'Spa', 'Free WiFi', 'Airport Shuttle'],
  //       images: [
  //         'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
  //         'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg',
  //         'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg'
  //       ],
  //       contact_name: 'Resort Manager',
  //       contact_email: 'manager@goabeach.com',
  //       contact_phone: '+91 832 227 8800',
  //       status: 'approved',
  //       is_active: true,
  //       is_available: true,
  //       created_at: '2024-01-20T00:00:00Z',
  //       updated_at: '2024-01-20T00:00:00Z',
  //       user: {
  //         name: 'Beach Resorts Ltd',
  //         email: 'contact@beachresorts.com'
  //       }
  //     },
  //     {
  //       id: '3',
  //       name: 'Kerala Homestay',
  //       description: 'Immerse yourself in authentic Kerala culture at this traditional homestay nestled among lush tea plantations. Experience warm hospitality and breathtaking mountain views.',
  //       location: 'Munnar, Kerala',
  //       address: 'Tea Garden Road, Munnar, Kerala 685612',
  //       property_type: 'homestay',
  //       price_per_night: 3500,
  //       max_guests: 4,
  //       bedrooms: 2,
  //       bathrooms: 1,
  //       amenities: ['Kitchen Access', 'Garden', 'Mountain View', 'Free WiFi', 'Traditional Meals', 'Nature Walks'],
  //       images: [
  //         'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  //         'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
  //         'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg'
  //       ],
  //       contact_name: 'Local Host',
  //       contact_email: 'host@keralahome.com',
  //       contact_phone: '+91 486 523 1234',
  //       status: 'approved',
  //       is_active: true,
  //       is_available: true,
  //       created_at: '2024-01-25T00:00:00Z',
  //       updated_at: '2024-01-25T00:00:00Z',
  //       user: {
  //         name: 'Local Family',
  //         email: 'family@keralahome.com'
  //       }
  //     }
  //   ];

  //   return mockHotels.find(h => h.id === id);
  // };

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
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Not Found</h2>
              <p className="text-gray-600 mb-4">{error || 'The hotel you are looking for does not exist or has been removed.'}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/hotel-search')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search Hotels
              </button>
              <button 
                onClick={() => navigate('/hotels')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                View All Hotels
              </button>
            </div>
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
                      <span className="text-lg font-semibold">{hotel.rating ? hotel.rating.toFixed(1) : '4.5'}</span>
                      <span className="text-sm ml-1">({hotel.review_count || '0'} reviews)</span>
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
                  { id: 'rooms', label: 'Bedrooms', icon: Bed },
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
        <h2 className="text-2xl font-bold text-gray-900">Available Bedrooms</h2>
      </div>
      
      {propertyRooms.length > 0 ? (
        <div className="space-y-6">
          {propertyRooms.map((room) => (
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
                      {/* Room Type Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-900 capitalize">
                          {room.type.replace('_', ' ')}
                        </span>
                      </div>
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
                            <span>{room.totalBeds} bed{room.totalBeds > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Up to {room.guests} guests</span>
                          </div>
                        </div>
                        {/* Bed Configuration Details */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Bed Configuration:</h4>
                          <p className="text-sm text-gray-600">{room.bedsDescription}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {room.originalPrice > room.price && (
                          <div className="text-sm text-gray-500 line-through">₹{room.originalPrice.toLocaleString()}</div>
                        )}
                        <div className="text-2xl font-bold text-gray-900">₹{room.price.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">per night</div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {room.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

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
      ) : (
        <div className="text-center py-12">
          <Bed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bedrooms Configured</h3>
          <p className="text-gray-600">
            This property doesn't have any bedroom configurations set up yet.
          </p>
        </div>
      )}
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
                  <NearbyAttractions propertyId={hotel.id} />
                  
                  {/* <div>
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
                  </div> */}
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
              <div className="mb-6" ref={guestDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guests & Rooms</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                  <button
                    type="button"
                    onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-left text-sm bg-white hover:bg-gray-50 transition-colors"
                  >
                    {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}, {bookingData.rooms} Room{bookingData.rooms !== 1 ? 's' : ''}
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
                            disabled={bookingData.guests <= 1}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="text-gray-900 font-medium w-6 text-center">
                            {bookingData.guests}
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
                              disabled={bookingData.children <= 0}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-4 w-4 text-gray-600" />
                            </button>
                            <span className="text-gray-900 font-medium w-6 text-center">
                              {bookingData.children}
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
                        {bookingData.children > 0 && (
                          <div className="mt-3 space-y-2">
                            {Array.from({ length: bookingData.children }).map((_, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <span className="text-sm text-gray-700">Child {index + 1} age</span>
                                <select
                                  value={bookingData.childrenAges[index] || 5}
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
                            disabled={bookingData.rooms <= 1}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="text-gray-900 font-medium w-6 text-center">
                            {bookingData.rooms}
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
                          onClick={() => setBookingData(prev => ({ ...prev, pets: !prev.pets }))}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            bookingData.pets ? 'bg-gray-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              bookingData.pets ? 'translate-x-5' : 'translate-x-0'
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