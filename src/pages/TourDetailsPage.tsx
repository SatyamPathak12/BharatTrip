import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Users, 
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
  Mountain,
  Plus,
  Minus,
  Globe,
  Compass,
  TrendingUp
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { tourService, Tour } from '../lib/tourService';
import { format } from 'date-fns';

const TourDetailsPage: React.FC = () => {
  const { tourId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTravelersDropdownOpen, setIsTravelersDropdownOpen] = useState(false);
  const travelersDropdownRef = useRef<HTMLDivElement>(null);

  // Get booking data from navigation state if available
  const stateData = location.state as any;
  
  const [bookingData, setBookingData] = useState({
    travelDate: stateData?.travelDate || '',
    travelers: stateData?.travelers || 2,
    children: 0,
    childrenAges: [] as number[]
  });

  // Calculate total travelers
  const totalTravelers = bookingData.travelers + bookingData.children;

  // Update traveler values
  const updateTravelerValue = (field: 'travelers' | 'children', delta: number) => {
    setBookingData(prev => {
      const newValue = Math.max(field === 'travelers' ? 1 : 0, prev[field] + delta);
      
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
    const handleClickOutside = (event: MouseEvent) => {
      if (travelersDropdownRef.current && !travelersDropdownRef.current.contains(event.target as Node)) {
        setIsTravelersDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tour details
  useEffect(() => {
    const loadTour = async () => {
      if (!tourId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching tour details for ID:', tourId);
        const result = await tourService.getTourById(tourId);
        
        if (result.success && result.tour) {
          setTour(result.tour);
        } else {
          console.error('Failed to fetch tour:', result.error);
          setError('Tour not found. Please try another tour.');
        }
      } catch (err) {
        console.error('Error fetching tour from database:', err);
        setError('Failed to load tour details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId]);

  const handleBookNow = () => {
  if (user) {
    navigate(`/tour-booking/${tourId}`, {
      state: {
        tour, // Pass the tour object
        travelDate: bookingData.travelDate,
        travelers: totalTravelers,
        childrenAges: bookingData.childrenAges
      }
    });
  } else {
    sessionStorage.setItem('redirectAfterLogin', `/tour-booking/${tourId}`);
    navigate('/login');
  }
};

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Professional Guide': <User className="h-5 w-5" />,
      'Transportation': <Car className="h-5 w-5" />,
      'Meals Included': <Coffee className="h-5 w-5" />,
      'Accommodation': <Building2 className="h-5 w-5" />,
      'Entry Tickets': <Award className="h-5 w-5" />,
      'Travel Insurance': <Shield className="h-5 w-5" />,
      'Photography': <Camera className="h-5 w-5" />,
      'Adventure Activities': <Mountain className="h-5 w-5" />
    };
    return iconMap[amenity] || <CheckCircle className="h-5 w-5" />;
  };

  const mockReviews = [
    {
      id: 1,
      user: 'Amit Patel',
      rating: 5,
      date: '2024-01-15',
      comment: 'Absolutely incredible experience! Our guide was knowledgeable and friendly. The itinerary was well-planned and we got to see all the highlights. Highly recommended!',
      helpful: 18
    },
    {
      id: 2,
      user: 'Sarah Williams',
      rating: 5,
      date: '2024-01-10',
      comment: 'This tour exceeded all expectations. Every detail was taken care of, from transportation to meals. The cultural experiences were authentic and memorable.',
      helpful: 12
    },
    {
      id: 3,
      user: 'Rajesh Kumar',
      rating: 4,
      date: '2024-01-05',
      comment: 'Great tour with beautiful locations. The accommodation was comfortable and the food was delicious. Would definitely book again!',
      helpful: 9
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tour details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Not Found</h2>
              <p className="text-gray-600 mb-4">{error || 'The tour you are looking for does not exist or has been removed.'}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/tours')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse All Tours
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const defaultImage = 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg';
  const tourImages = tour.images && tour.images.length > 0 ? tour.images : [defaultImage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header variant="page" />
      
      {/* Hero Section */}
      <div className="pt-16 relative">
        <div className="relative h-96 overflow-hidden">
          {!showVideo ? (
            <img
              src={tourImages[currentImageIndex]}
              alt={tour.title}
              className="w-full h-full object-cover"
            />
          ) : tour.videos && tour.videos.length > 0 ? (
            <video
              src={tour.videos[0]}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : null}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full hover:bg-white transition-all duration-300 shadow-lg z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Media Buttons */}
          <div className="absolute top-6 right-6 flex gap-2 z-10">
            {tour.videos && tour.videos.length > 0 && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg flex items-center space-x-2"
              >
                {showVideo ? <Camera className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="text-sm font-medium">{showVideo ? 'Photos' : 'Video'}</span>
              </button>
            )}
            <button
              onClick={() => setShowImageGallery(true)}
              className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full hover:bg-white transition-all duration-300 shadow-lg flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span className="text-sm font-medium">{tourImages.length} Photos</span>
            </button>
          </div>

          {/* Tour Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tour.category === 'Cultural' ? 'bg-purple-600' :
                      tour.category === 'Adventure' ? 'bg-green-600' :
                      tour.category === 'Nature' ? 'bg-blue-600' :
                      tour.category === 'Wildlife' ? 'bg-orange-600' :
                      tour.category === 'Beach' ? 'bg-cyan-600' :
                      'bg-gray-600'
                    }`}>
                      {tour.category}
                    </span>
                    {tour.featured && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{tour.title}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="text-lg">{tour.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="text-lg font-semibold">{tour.rating}</span>
                      <span className="text-sm ml-1">({tour.reviews_count} reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{tour.group_size}</span>
                    </div>
                    <div className="flex items-center">
                      <Mountain className="h-4 w-4 mr-1" />
                      <span>{tour.difficulty}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {tour.original_price > tour.price && (
                    <div className="text-xl text-gray-300 line-through">₹{tour.original_price.toLocaleString()}</div>
                  )}
                  <div className="text-3xl font-bold">₹{tour.price.toLocaleString()}</div>
                  <div className="text-lg text-gray-200">per person</div>
                  {tour.discount_percentage && tour.discount_percentage > 0 && (
                    <div className="mt-1">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                        Save {tour.discount_percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Image Navigation */}
          {!showVideo && tourImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : tourImages.length - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(currentImageIndex < tourImages.length - 1 ? currentImageIndex + 1 : 0)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors z-10"
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
                  { id: 'overview', label: 'Overview', icon: Globe },
                  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
                  { id: 'highlights', label: 'Highlights', icon: Star },
                  { id: 'includes', label: 'What\'s Included', icon: CheckCircle },
                  { id: 'reviews', label: 'Reviews', icon: ThumbsUp }
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
                  <h2 className="text-2xl font-bold text-gray-900">Tour Overview</h2>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6 text-lg">{tour.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tour Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold text-gray-900">{tour.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Group Size:</span>
                        <span className="font-semibold text-gray-900">{tour.group_size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className="font-semibold text-gray-900">{tour.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Languages:</span>
                        <span className="font-semibold text-gray-900">
                          {tour.languages?.join(', ') || 'English'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Facts</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Instant confirmation</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Mobile ticket accepted</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Free cancellation available</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700">Expert local guide</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Tour Itinerary</h2>
                </div>
                
                {tour.itinerary && tour.itinerary.length > 0 ? (
                  <div className="space-y-6">
                    {tour.itinerary.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          {index < tour.itinerary!.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-blue-600 to-orange-500 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-700 leading-relaxed">{item.description}</p>
                          {item.duration && (
                            <div className="mt-2 flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{item.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Detailed itinerary will be provided upon booking.</p>
                )}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Tour Highlights</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tour.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-900">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'includes' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">What's Included</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      Included
                    </h3>
                    <div className="space-y-3">
                      {tour.included?.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <X className="h-5 w-5 text-red-600 mr-2" />
                      Not Included
                    </h3>
                    <div className="space-y-3">
                      {tour.excluded?.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {tour.cancellation_policy && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
                    <p className="text-gray-700">{tour.cancellation_policy}</p>
                  </div>
                )}
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
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 sticky top-24">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900">Book This Tour</h3>
              </div>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="text-center">
                  {tour.original_price > tour.price && (
                    <div className="text-lg text-gray-500 line-through mb-1">₹{tour.original_price.toLocaleString()}</div>
                  )}
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹{tour.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">per person</div>
                  {tour.discount_percentage && tour.discount_percentage > 0 && (
                    <div className="mt-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Save {tour.discount_percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Travel Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Travel Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                  <input
                    type="date"
                    value={bookingData.travelDate}
                    onChange={(e) => setBookingData({ ...bookingData, travelDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Travelers Selection */}
              <div className="mb-6" ref={travelersDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Travelers</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                  <button
                    type="button"
                    onClick={() => setIsTravelersDropdownOpen(!isTravelersDropdownOpen)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-left text-sm bg-white hover:bg-gray-50 transition-colors"
                  >
                    {totalTravelers} Traveler{totalTravelers !== 1 ? 's' : ''}
                  </button>

                  {/* Dropdown Panel */}
                  {isTravelersDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-900 font-medium text-sm">Adults</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateTravelerValue('travelers', -1)}
                            disabled={bookingData.travelers <= 1}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="text-gray-900 font-medium w-6 text-center">
                            {bookingData.travelers}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateTravelerValue('travelers', 1)}
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
                              onClick={() => updateTravelerValue('children', -1)}
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
                              onClick={() => updateTravelerValue('children', 1)}
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
                          </div>
                        )}
                      </div>

                      {/* Done Button */}
                      <button
                        type="button"
                        onClick={() => setIsTravelersDropdownOpen(false)}
                        className="w-full mt-3 py-2.5 text-blue-600 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              {bookingData.travelDate && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">₹{tour.price.toLocaleString()} × {totalTravelers} {totalTravelers === 1 ? 'traveler' : 'travelers'}</span>
                      <span className="font-medium text-gray-900">₹{(tour.price * totalTravelers).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium text-gray-900">₹{Math.round(tour.price * totalTravelers * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-medium text-gray-900">₹{Math.round(tour.price * totalTravelers * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-orange-500">₹{Math.round(tour.price * totalTravelers * 1.10).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                onClick={handleBookNow}
                disabled={!bookingData.travelDate}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {bookingData.travelDate ? 'Book Now' : 'Select Date to Book'}
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
                    <span className="text-gray-700">{tour.contact_phone || '+91 1800 123 4567'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{tour.contact_email || 'tours@example.com'}</span>
                  </div>
                </div>
              </div>

              {/* Why Book With Us */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Why Book With Us</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Best price guarantee</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Trusted by thousands</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">Safe and secure payments</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 text-orange-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">24/7 customer support</span>
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
                src={tourImages[currentImageIndex]}
                alt={`${tour.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              
              {tourImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : tourImages.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(currentImageIndex < tourImages.length - 1 ? currentImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {tourImages.map((_: string, index: number) => (
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

export default TourDetailsPage;