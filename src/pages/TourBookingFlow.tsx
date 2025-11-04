import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Calendar,
  CreditCard,
  Shield,
  CheckCircle,
  Info,
  Phone,
  Mail,
  User,
  Plus,
  Minus,
  Mountain,
  Camera,
  Play,
  Heart,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tourService, Tour } from '../lib/tourService';
import { bookingService } from '../lib/bookingService';
import { format } from 'date-fns';

// Scroll to top utility function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

const TourBookingFlow: React.FC = () => {
  const { tourId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get tour data from navigation state if available
  const stateData = location.state as any;
  
  const [bookingData, setBookingData] = useState({
    travelers: stateData?.travelers || 2,
    travelDate: stateData?.travelDate || '',
    specialRequests: '',
    childrenAges: stateData?.childrenAges || [],
    guestDetails: {
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      country: 'India'
    }
  });
  
  // Scroll to top when component mounts
  useEffect(() => {
    scrollToTop();
  }, []);

  // Load tour data
  useEffect(() => {
    const loadTour = async () => {
      if (!tourId) {
        setError('Tour ID not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Check if tour was passed via navigation state
        if (stateData?.tour) {
          console.log('Using tour from navigation state');
          setTour(stateData.tour);
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from database
        console.log('Fetching tour from database:', tourId);
        const result = await tourService.getTourById(tourId);
        
        if (result.success && result.tour) {
          console.log('Tour fetched successfully:', result.tour);
          setTour(result.tour);
        } else {
          console.error('Failed to fetch tour:', result.error);
          setError(result.error || 'Tour not found');
        }
      } catch (err) {
        console.error('Error loading tour:', err);
        setError('Failed to load tour details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTour();
  }, [tourId, stateData]);

  // Check if user is authenticated
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', `/tour-booking/${tourId}`);
    navigate('/login');
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tour details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The tour you are trying to book does not exist or has been removed.'}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/tours')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Browse All Tours
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Select Options', component: TourOptions },
    { id: 2, title: 'Guest Details', component: GuestDetails },
    { id: 3, title: 'Payment', component: PaymentDetails },
    { id: 4, title: 'Confirmation', component: BookingConfirmation }
  ];

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component || TourOptions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Back Button - Left Side */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-300 bg-white/50 px-4 py-2 rounded-lg hover:bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            
            {/* Logo - Center */}
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-blue-600 drop-shadow-sm" />
              <span className="text-2xl font-bold">
                <span className="text-blue-600">Bharat</span>
                <span className="text-orange-500">Trips</span>
              </span>
            </div>
            
            {/* Empty space for balance */}
            <div className="w-32"></div>
          </div>
          
          {/* Progress Bar */}
          <div className="pb-6">
            <div className="flex items-center justify-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === step.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : currentStep > step.id 
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white/60 text-gray-600 border border-gray-300'
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 
                    currentStep > step.id ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CurrentStepComponent 
        tour={tour}
        bookingData={bookingData}
        setBookingData={setBookingData}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        navigate={navigate}
      />
    </div>
  );
};

// Tour Options Component
const TourOptions: React.FC<any> = ({ tour, bookingData, setBookingData, setCurrentStep }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const handleTravelersChange = (increment: boolean) => {
    const newCount = increment ? bookingData.travelers + 1 : Math.max(1, bookingData.travelers - 1);
    setBookingData({ ...bookingData, travelers: newCount });
  };

  const defaultImage = 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg';
  const tourImages = tour.images && tour.images.length > 0 ? tour.images : [defaultImage];
  const tourVideos = tour.videos || [];

  const totalPrice = tour.price * bookingData.travelers;
  const savings = tour.original_price > tour.price ? (tour.original_price - tour.price) * bookingData.travelers : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tour Details - Left Side */}
        <div className="lg:col-span-2">
          {/* Tour Images/Video */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
            <div className="relative h-80">
              {!showVideo ? (
                <>
                  <img
                    src={tourImages[currentImageIndex]}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                  {tourVideos.length > 0 && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Play className="h-6 w-6" />
                    </button>
                  )}
                </>
              ) : (
                <div className="relative">
                  <video
                    src={tourVideos[0]}
                    controls
                    className="w-full h-full object-cover"
                    autoPlay
                  />
                  <button
                    onClick={() => setShowVideo(false)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {/* Image Navigation */}
              {tourImages.length > 1 && !showVideo && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
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
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
                <button className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors">
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tour Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h1 className="text-3xl font-bold text-gray-900">{tour.title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{tour.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>{tour.group_size}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mountain className="h-5 w-5 mr-2" />
                <span>{tour.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-medium text-gray-900 ml-1">{tour.rating}</span>
              <span className="text-gray-500 ml-2">({tour.reviews_count} reviews)</span>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                tour.category === 'Cultural' ? 'bg-purple-100 text-purple-800' :
                tour.category === 'Adventure' ? 'bg-green-100 text-green-800' :
                tour.category === 'Nature' ? 'bg-blue-100 text-blue-800' :
                tour.category === 'Wildlife' ? 'bg-orange-100 text-orange-800' :
                tour.category === 'Beach' ? 'bg-cyan-100 text-cyan-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tour.category}
              </span>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">{tour.description}</p>

            {/* Tour Highlights */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tour Highlights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tour.highlights.map((highlight: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included</h3>
                <div className="space-y-2">
                  {(tour.included || tour.includes || []).map((item: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Not Included</h3>
                <div className="space-y-2">
                  {(tour.excluded || tour.excludes || []).map((item: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="h-4 w-4 border-2 border-red-300 rounded-full mr-2 flex items-center justify-center">
                        <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Options - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Book Your Tour</h3>
            </div>

            {/* Price Display */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              {tour.original_price > tour.price && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Original Price</span>
                  <span className="text-sm text-gray-500 line-through">₹{tour.original_price.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">Tour Price</span>
                <span className="text-2xl font-bold text-blue-600">₹{tour.price.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-600">per person</div>
              {savings > 0 && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  You save ₹{savings.toLocaleString()}!
                </div>
              )}
            </div>

            {/* Travel Date */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Preferred Travel Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  value={bookingData.travelDate}
                  onChange={(e) => setBookingData({ ...bookingData, travelDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Number of Travelers */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Number of Travelers
              </label>
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
                <button
                  onClick={() => handleTravelersChange(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  disabled={bookingData.travelers <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{bookingData.travelers}</div>
                  <div className="text-sm text-gray-600">
                    {bookingData.travelers === 1 ? 'Traveler' : 'Travelers'}
                  </div>
                </div>
                <button
                  onClick={() => handleTravelersChange(true)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Price</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">₹{totalPrice.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">for {bookingData.travelers} {bookingData.travelers === 1 ? 'person' : 'people'}</div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!bookingData.travelDate}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              Continue to Guest Details
            </button>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2" />
              <span>Secure booking process</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Guest Details Component (keep existing implementation)
const GuestDetails: React.FC<any> = ({ tour, bookingData, setBookingData, setCurrentStep }) => {
  const handleInputChange = (field: string, value: string) => {
    setBookingData({
      ...bookingData,
      guestDetails: {
        ...bookingData.guestDetails,
        [field]: value
      }
    });
  };

  const handleContinue = () => {
    const { firstName, lastName, email, phone } = bookingData.guestDetails;
    if (firstName && lastName && email && phone) {
      setCurrentStep(3);
    }
  };

  const totalPrice = tour.price * bookingData.travelers;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Enter your details
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          We'll use these details to send you confirmation and updates about your tour booking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Guest Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  value={bookingData.guestDetails.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  value={bookingData.guestDetails.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                    value={bookingData.guestDetails.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                    value={bookingData.guestDetails.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Country/Region
                </label>
                <select
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 appearance-none"
                  value={bookingData.guestDetails.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 resize-none"
                  placeholder="Any special requests or requirements..."
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold hover:border-gray-400 transform hover:scale-105"
              >
                Back to options
              </button>
              <button
                onClick={handleContinue}
                disabled={!bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName || !bookingData.guestDetails.email || !bookingData.guestDetails.phone}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                Continue to payment
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Booking Summary</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tour</span>
                <span className="font-semibold text-gray-900">{tour.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-semibold text-gray-900">{tour.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">{tour.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Date</span>
                <span className="font-semibold text-gray-900">
                  {bookingData.travelDate ? format(new Date(bookingData.travelDate), 'MMM dd, yyyy') : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travelers</span>
                <span className="font-semibold text-gray-900">{bookingData.travelers} {bookingData.travelers === 1 ? 'person' : 'people'}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour price</span>
                  <span className="font-semibold text-gray-900">₹{tour.price.toLocaleString()} × {bookingData.travelers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee</span>
                  <span className="font-semibold text-gray-900">₹{Math.round(totalPrice * 0.05).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">₹{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payment Details Component
const PaymentDetails: React.FC<any> = ({ tour, bookingData, setCurrentStep, navigate }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedBookingId, setSavedBookingId] = useState('');

  const totalPrice = tour.price * bookingData.travelers;
  const serviceFee = Math.round(totalPrice * 0.05);
  const finalTotal = totalPrice + serviceFee;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Starting booking process...');
      console.log('Booking data:', bookingData);
      console.log('Tour data:', tour);

      // Validate required fields
      if (!bookingData.guestDetails.firstName || !bookingData.guestDetails.lastName) {
        alert('Please fill in all guest details');
        setIsProcessing(false);
        return;
      }

      if (!bookingData.travelDate) {
        alert('Please select a travel date');
        setIsProcessing(false);
        return;
      }

      // Create booking data object
      const createBookingData = {
        // Tour Information
        tour_id: tour.id,
        tour_title: tour.title,
        tour_location: tour.location,
        tour_duration: tour.duration,
        
        // Guest Details
        guest_first_name: bookingData.guestDetails.firstName,
        guest_last_name: bookingData.guestDetails.lastName,
        guest_email: bookingData.guestDetails.email,
        guest_phone: bookingData.guestDetails.phone,
        guest_country: bookingData.guestDetails.country,
        
        // Booking Details
        travel_date: bookingData.travelDate,
        number_of_travelers: bookingData.travelers,
        children_count: 0,
        children_ages: bookingData.childrenAges || [],
        special_requests: bookingData.specialRequests || '',
        
        // Pricing
        price_per_person: tour.price,
        total_price: totalPrice,
        service_fee: serviceFee,
        final_total: finalTotal,
        discount_applied: tour.original_price > tour.price ? 
          (tour.original_price - tour.price) * bookingData.travelers : 0,
        
        // Payment Information
        payment_method: paymentMethod
      };

      console.log('Sending booking data to service:', createBookingData);

      // Save booking to database
      const result = await bookingService.createBooking(createBookingData);
      
      console.log('Booking result:', result);

      if (result.success && result.booking) {
        console.log('Booking created successfully:', result.booking);
        setSavedBookingId(result.booking.booking_id);
        
        // Small delay to simulate payment processing
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(4);
        }, 1000);
      } else {
        console.error('Failed to create booking:', result.error);
        alert(`Failed to create booking: ${result.error || 'Unknown error'}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6 shadow-lg">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Payment Details
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Your booking is protected by our secure payment system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center p-6 border-2 rounded-xl cursor-pointer hover:bg-blue-50 transition-all duration-300 hover:border-blue-300 group">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600 w-5 h-5"
                />
                <CreditCard className="h-6 w-6 ml-4 mr-3 text-gray-600 group-hover:text-blue-600 transition-colors" />
                <span className="font-semibold text-lg">Credit/Debit Card</span>
              </label>
              
              <label className="flex items-center p-6 border-2 rounded-xl cursor-pointer hover:bg-purple-50 transition-all duration-300 hover:border-purple-300 group">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-orange-500 w-5 h-5"
                />
                <Phone className="h-6 w-6 ml-4 mr-3 text-gray-600 group-hover:text-orange-500 transition-colors" />
                <span className="font-semibold text-lg">UPI</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-900">Card Details</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Card number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 text-lg"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-blue-600 mt-1 mr-4" />
              <div>
                <h4 className="font-bold text-blue-900 text-lg">Secure Payment</h4>
                <p className="text-blue-700 mt-2">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold hover:border-gray-400 transform hover:scale-105"
            >
              Back to details
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Complete Booking - ₹${finalTotal.toLocaleString()}`
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Final Summary</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tour</span>
                <span className="font-semibold text-gray-900">{tour.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Date</span>
                <span className="font-semibold text-gray-900">
                  {bookingData.travelDate ? format(new Date(bookingData.travelDate), 'MMM dd, yyyy') : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travelers</span>
                <span className="font-semibold text-gray-900">{bookingData.travelers} {bookingData.travelers === 1 ? 'person' : 'people'}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour price</span>
                  <span className="font-semibold text-gray-900">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee</span>
                  <span className="font-semibold text-gray-900">₹{serviceFee.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-green-50 to-blue-50 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex justify-between text-xl font-bold text-green-600">
                  <span>Total to pay</span>
                  <span className="text-orange-500">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Booking Confirmation Component
const BookingConfirmation: React.FC<any> = ({ tour, bookingData, navigate }) => {
  const [displayBookingId, setDisplayBookingId] = useState('');

  useEffect(() => {
    // Generate booking ID for display
    const bookingId = 'BT' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setDisplayBookingId(bookingId);
  }, []);

  const totalPrice = tour.price * bookingData.travelers;
  const serviceFee = Math.round(totalPrice * 0.05);
  const finalTotal = totalPrice + serviceFee;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-8 shadow-2xl animate-pulse">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mx-auto"></div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-12">
        <h1 className="text-5xl font-bold text-blue-600 mb-6">
          Tour Booked Successfully!
        </h1>
        <p className="text-2xl text-gray-600 mb-10 leading-relaxed">
          Your tour booking for <span className="font-bold text-gray-900">{tour.title}</span> has been confirmed.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 mb-10 border border-blue-100">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID</span>
              <span className="font-bold text-blue-600 text-lg">{displayBookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tour</span>
              <span className="font-semibold text-gray-900">{tour.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travel Date</span>
              <span className="font-semibold text-gray-900">
                {bookingData.travelDate ? format(new Date(bookingData.travelDate), 'MMM dd, yyyy') : 'TBD'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travelers</span>
              <span className="font-semibold text-gray-900">{bookingData.travelers} {bookingData.travelers === 1 ? 'person' : 'people'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold text-gray-900">{tour.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-bold text-orange-500 text-xl">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-orange-500 text-white py-4 px-8 rounded-xl hover:bg-orange-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/tours')}
            className="w-full border-2 border-gray-300 text-gray-700 py-4 px-8 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg hover:border-gray-400 transform hover:scale-105"
          >
            Browse More Tours
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <p className="text-blue-800 font-medium">
              A confirmation email has been sent to {bookingData.guestDetails.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourBookingFlow;