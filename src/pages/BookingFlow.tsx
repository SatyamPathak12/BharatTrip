import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Users, 
  Calendar,
  CreditCard,
  Shield,
  CheckCircle,
  Info,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  User,
  Plus,
  Minus
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

// Scroll to top utility function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

const BookingFlow: React.FC = () => {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchFilters, properties } = useBooking();
  const [currentStep, setCurrentStep] = useState(1);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Scroll to top when component mounts
  React.useEffect(() => {
    scrollToTop();
  }, []);

  // Load property data
  React.useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      
      // First check if property exists in current search results
      let foundProperty = properties.find(p => p.id === propertyId);
      
      if (!foundProperty) {
        // If not found, load mock property data (simulate API call)
        const mockProperties = [
          {
            id: '1',
            name: 'Taj Palace Mumbai',
            location: 'Mumbai, Maharashtra',
            price: 8500,
            rating: 4.8,
            images: ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
            amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant'],
            type: 'hotel',
            description: 'Luxury hotel in the heart of Mumbai',
            available: true,
          },
          {
            id: '2',
            name: 'Goa Beach Resort',
            location: 'Goa',
            price: 6200,
            rating: 4.5,
            images: ['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'],
            amenities: ['Beach Access', 'Pool', 'Restaurant', 'Bar'],
            type: 'resort',
            description: 'Beachfront resort with stunning ocean views',
            available: true,
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
          },
        ];
        
        foundProperty = mockProperties.find(p => p.id === propertyId);
      }
      
      if (foundProperty) {
        setProperty(foundProperty);
      }
      
      setIsLoading(false);
    };
    
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId, properties]);

  // Check if user is authenticated
  if (!user) {
    // If user is not logged in, redirect to login
    navigate('/login');
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h2>
          <button 
            onClick={() => navigate('/search')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            Back to search results
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Select Room', component: RoomSelection },
    { id: 2, title: 'Guest Details', component: GuestDetails },
    { id: 3, title: 'Payment', component: PaymentDetails },
    { id: 4, title: 'Confirmation', component: BookingConfirmation }
  ];

  const CurrentStepComponent = steps.find(step => step.id === currentStep)?.component || RoomSelection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Back Button - Left Side */}
            <button
              onClick={() => navigate('/search')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-300 bg-white/50 px-4 py-2 rounded-lg hover:bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to search</span>
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
        property={property}
        searchFilters={searchFilters}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        navigate={navigate}
      />
    </div>
  );
};

// Room Selection Component
const RoomSelection: React.FC<any> = ({ property, searchFilters, setCurrentStep }) => {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  const rooms = [
    {
      id: 1,
      name: 'Deluxe Room',
      size: '25 sqm',
      beds: '1 King Bed',
      guests: 2,
      price: property.price,
      originalPrice: property.price + 1000,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar'],
      images: [property.images[0]],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true
    },
    {
      id: 2,
      name: 'Superior Room',
      size: '30 sqm',
      beds: '1 King Bed',
      guests: 2,
      price: property.price + 1500,
      originalPrice: property.price + 2500,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Balcony'],
      images: [property.images[0]],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true
    },
    {
      id: 3,
      name: 'Suite',
      size: '45 sqm',
      beds: '1 King Bed + Sofa Bed',
      guests: 4,
      price: property.price + 3000,
      originalPrice: property.price + 4000,
      amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Balcony', 'Living Area'],
      images: [property.images[0]],
      cancellation: 'Free cancellation until 24 hours before check-in',
      breakfast: true
    }
  ];

  const nights = searchFilters.checkIn && searchFilters.checkOut 
    ? Math.ceil((new Date(searchFilters.checkOut).getTime() - new Date(searchFilters.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
            <img
              src={property.images[0]}
              alt={property.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{property.name}</h2>
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{property.location}</span>
            </div>
            <div className="flex items-center mb-4">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900 ml-1">{property.rating}</span>
              <span className="text-sm text-gray-500 ml-2">Excellent</span>
            </div>
            
            {/* Booking Details */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Your booking details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{searchFilters.checkIn ? format(new Date(searchFilters.checkIn), 'MMM dd, yyyy') : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{searchFilters.checkOut ? format(new Date(searchFilters.checkOut), 'MMM dd, yyyy') : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">{searchFilters.guests} guest{searchFilters.guests > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Select your room</h1>
            <p className="text-gray-600">Choose from our available rooms for your stay</p>
          </div>

          <div className="space-y-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Room Image */}
                    <div className="lg:w-64">
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>

                    {/* Room Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Square className="h-4 w-4 mr-1" />
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
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
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
                        onClick={() => {
                          setSelectedRoom(room);
                          setCurrentStep(2);
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
    </div>
  );
};

// Guest Details Component
const GuestDetails: React.FC<any> = ({ property, searchFilters, setCurrentStep }) => {
  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'India',
    specialRequests: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setGuestDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Validate required fields
    if (guestDetails.firstName && guestDetails.lastName && guestDetails.email && guestDetails.phone) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Enter your details
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          We'll use these details to send you confirmation and updates about your booking
        </p>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter your details</h1>
        <p className="text-gray-600">We'll use these details to send you confirmation and updates about your booking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Guest Form */}
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
                  value={guestDetails.firstName}
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
                  value={guestDetails.lastName}
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
                    value={guestDetails.email}
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
                    value={guestDetails.phone}
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
                  value={guestDetails.country}
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
                  value={guestDetails.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold hover:border-gray-400 transform hover:scale-105"
              >
                Back to rooms
              </button>
              <button
                onClick={handleContinue}
                disabled={!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.phone}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                Continue to payment
              </button>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Booking Summary</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property</span>
                <span className="font-semibold text-gray-900">{property.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room</span>
                <span className="font-semibold text-gray-900">Deluxe Room</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dates</span>
                <span className="font-semibold text-gray-900">
                  {searchFilters.checkIn ? format(new Date(searchFilters.checkIn), 'MMM dd') : 'Not selected'} - {searchFilters.checkOut ? format(new Date(searchFilters.checkOut), 'MMM dd') : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests</span>
                <span className="font-semibold text-gray-900">{searchFilters.guests} guest{searchFilters.guests > 1 ? 's' : ''}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate</span>
                  <span className="font-semibold text-gray-900">₹{property.price.toLocaleString()}/night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="font-semibold text-gray-900">₹{Math.round(property.price * 0.18).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">₹{(property.price + Math.round(property.price * 0.18)).toLocaleString()}</span>
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
const PaymentDetails: React.FC<any> = ({ property, setCurrentStep, navigate }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(4);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment details</h1>
        <p className="text-gray-600">Your booking is protected by our secure payment system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Methods */}
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

          {/* Card Details */}
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

          {/* Security Notice */}
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

          {/* Action Buttons */}
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
                'Complete Booking'
              )}
            </button>
          </div>
        </div>

        {/* Final Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-gray-900">Final Summary</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property</span>
                <span className="font-semibold text-gray-900">{property.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room</span>
                <span className="font-semibold text-gray-900">Deluxe Room</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in</span>
                <span className="font-semibold text-gray-900">Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out</span>
                <span className="font-semibold text-gray-900">Tomorrow</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate</span>
                  <span className="font-semibold text-gray-900">₹{property.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="font-semibold text-gray-900">₹{Math.round(property.price * 0.18).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-green-50 to-blue-50 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex justify-between text-xl font-bold text-green-600">
                  <span>Total to pay</span>
                  <span className="text-orange-500">₹{(property.price + Math.round(property.price * 0.18)).toLocaleString()}</span>
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
const BookingConfirmation: React.FC<any> = ({ property, navigate }) => {
  const bookingId = 'BT' + Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Success Animation */}
      <div className="mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-8 shadow-2xl animate-pulse">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mx-auto"></div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-12">
        <h1 className="text-5xl font-bold text-blue-600 mb-6">
          Booking Confirmed!
        </h1>
        <p className="text-2xl text-gray-600 mb-10 leading-relaxed">
          Your reservation at <span className="font-bold text-gray-900">{property.name}</span> has been successfully confirmed.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 mb-10 border border-blue-100">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-orange-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID</span>
              <span className="font-bold text-blue-600 text-lg">{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Property</span>
              <span className="font-semibold text-gray-900">{property.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Room</span>
              <span className="font-semibold text-gray-900">Deluxe Room</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-bold text-orange-500 text-xl">₹{(property.price + Math.round(property.price * 0.18)).toLocaleString()}</span>
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
            onClick={() => navigate('/search')}
            className="w-full border-2 border-gray-300 text-gray-700 py-4 px-8 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg hover:border-gray-400 transform hover:scale-105"
          >
            Search More Properties
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <p className="text-blue-800 font-medium">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;