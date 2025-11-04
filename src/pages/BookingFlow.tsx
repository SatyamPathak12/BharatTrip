import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Minus,
  Building2,
  Home
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { hotelService } from '../lib/hotelService';
import { supabase } from '../lib/supabase';

const BookingFlow: React.FC = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: location.state?.checkIn || '',
    checkOut: location.state?.checkOut || '',
    guests: location.state?.guests || 2,
    rooms: location.state?.rooms || 1
  });

  const [guestDetails, setGuestDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'India',
    specialRequests: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');

useEffect(() => {
  const loadProperty = async () => {
    if (!hotelId) {
      console.error('No hotelId provided');
      setIsLoading(false);
      return;
    }

    console.log('Loading property with ID:', hotelId);
    setIsLoading(true);

    try {
      // First, check if property data was passed via navigation state
      const propertyFromState = location.state?.property;
      
      if (propertyFromState) {
        console.log('Using property data from navigation state:', propertyFromState);
        
        // Transform the state property to match expected format
        setProperty({
          id: propertyFromState.id,
          name: propertyFromState.name,
          location: propertyFromState.location,
          price: propertyFromState.price || propertyFromState.price_per_night,
          rating: propertyFromState.rating || 4.5,
          images: propertyFromState.images && propertyFromState.images.length > 0 
            ? propertyFromState.images 
            : ['https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
          amenities: propertyFromState.amenities || [],
          type: propertyFromState.type || propertyFromState.property_type,
          description: propertyFromState.description,
          available: propertyFromState.available !== undefined ? propertyFromState.available : propertyFromState.is_available,
          maxGuests: propertyFromState.maxGuests || propertyFromState.max_guests,
          bedrooms: propertyFromState.bedrooms,
          bathrooms: propertyFromState.bathrooms,
          owner: propertyFromState.owner || propertyFromState.user?.name || 'Property Owner',
          bedConfiguration: propertyFromState.bedConfiguration || propertyFromState.bed_configuration || null,
          propertySize: propertyFromState.propertySize || propertyFromState.property_size,
          userId: propertyFromState.userId || propertyFromState.user_id
        });
        
        console.log('Property set from state successfully');
        setIsLoading(false);
        return; // Exit early since we have the data
      }
      
      // If no state data, fetch from database
      console.log('No state data, fetching from database...');
      const result = await hotelService.getHotelById(hotelId);
      
      console.log('Property fetch result:', result);
      
      if (result.success && result.hotel) {
        const hotel = result.hotel;
        
        console.log('Property found:', hotel.name, 'Status:', hotel.status, 'Available:', hotel.is_available);
        
        setProperty({
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
          owner: hotel.user?.name || 'Property Owner',
          bedConfiguration: hotel.bed_configuration || null,
          propertySize: hotel.property_size,
          userId: hotel.user_id
        });
        console.log('Property set successfully with bed config:', hotel.bed_configuration);
      } else {
        console.error('Property not found or fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadProperty();
}, [hotelId, location.state]);

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 1;
    return differenceInDays(new Date(bookingData.checkOut), new Date(bookingData.checkIn)) || 1;
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    const nights = calculateNights();
    const roomTotal = selectedRoom.price * nights;
    const taxes = Math.round(roomTotal * 0.18);
    return roomTotal + taxes;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBookingId = 'BT' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Save booking to Supabase
      const { data: userData } = await supabase.auth.getUser();
      
      const bookingPayload = {
        property_id: property.id,
        user_id: userData?.user?.id || null,
        guest_name: `${guestDetails.firstName} ${guestDetails.lastName}`,
        guest_email: guestDetails.email,
        guest_phone: guestDetails.phone,
        guest_country: guestDetails.country,
        check_in_date: bookingData.checkIn,
        check_out_date: bookingData.checkOut,
        number_of_nights: calculateNights(),
        number_of_guests: bookingData.guests,
        room_type: selectedRoom.name,
        room_details: {
          bedroomName: selectedRoom.bedroomName,
          beds: selectedRoom.beds,
          bedDetails: selectedRoom.bedDetails || [],
          size: selectedRoom.size,
          amenities: selectedRoom.amenities
        },
        price_per_night: selectedRoom.price,
        total_room_cost: selectedRoom.price * calculateNights(),
        taxes_and_fees: Math.round(selectedRoom.price * calculateNights() * 0.18),
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        payment_status: 'completed',
        booking_status: 'confirmed',
        booking_reference: newBookingId,
        special_requests: guestDetails.specialRequests || null,
        cancellation_policy: 'Free cancellation until 24 hours before check-in',
        payment_details: paymentMethod === 'card' 
          ? { last4: cardDetails.number.slice(-4), cardHolder: cardDetails.name }
          : { upiId: upiId }
      };

      const { data, error } = await supabase
        .from('property_bookings')
        .insert([bookingPayload])
        .select()
        .single();

      if (error) {
        console.error('Error saving booking:', error);
        alert('Booking saved locally but could not sync with server. Please contact support with booking ID: ' + newBookingId);
      } else {
        console.log('Booking saved successfully:', data);
      }

      setBookingId(newBookingId);
      setIsProcessing(false);
      setCurrentStep(4);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      alert('An error occurred during payment. Please try again.');
    }
  };

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
            onClick={() => navigate('/hotel-search')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
          >
            Back to search
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Select Room' },
    { id: 2, title: 'Guest Details' },
    { id: 3, title: 'Payment' },
    { id: 4, title: 'Confirmation' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-all bg-white/50 px-4 py-2 rounded-lg hover:bg-white/80"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">
                <span className="text-blue-600">Bharat</span>
                <span className="text-orange-500">Trips</span>
              </span>
            </div>
            
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
                  <span className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 
                    currentStep > step.id ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 ${
                      currentStep > step.id ? 'bg-green-400' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <RoomSelection 
          property={property}
          bookingData={bookingData}
          setSelectedRoom={setSelectedRoom}
          setCurrentStep={setCurrentStep}
          calculateNights={calculateNights}
        />
      )}
      
      {currentStep === 2 && (
        <GuestDetails 
          property={property}
          bookingData={bookingData}
          selectedRoom={selectedRoom}
          guestDetails={guestDetails}
          setGuestDetails={setGuestDetails}
          setCurrentStep={setCurrentStep}
          calculateNights={calculateNights}
        />
      )}
      
      {currentStep === 3 && (
        <PaymentDetails 
          property={property}
          bookingData={bookingData}
          selectedRoom={selectedRoom}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cardDetails={cardDetails}
          setCardDetails={setCardDetails}
          upiId={upiId}
          setUpiId={setUpiId}
          isProcessing={isProcessing}
          handlePayment={handlePayment}
          setCurrentStep={setCurrentStep}
          calculateNights={calculateNights}
          calculateTotal={calculateTotal}
        />
      )}
      
      {currentStep === 4 && (
        <BookingConfirmation 
          property={property}
          bookingData={bookingData}
          selectedRoom={selectedRoom}
          bookingId={bookingId}
          navigate={navigate}
          calculateTotal={calculateTotal}
        />
      )}
    </div>
  );
};

const RoomSelection: React.FC<any> = ({ property, bookingData, setSelectedRoom, setCurrentStep, calculateNights }) => {
  const generateRoomsFromBedConfig = () => {
    if (!property.bedConfiguration) {
      // Fallback to dummy data if no bed configuration
      return [
        {
          id: 1,
          name: 'Standard Room',
          bedroomName: 'Main Bedroom',
          size: property.propertySize || '25 sqm',
          beds: '1 King Bed',
          guests: property.maxGuests || 2,
          price: property.price,
          originalPrice: property.price + 1000,
          amenities: property.amenities?.slice(0, 5) || ['Free WiFi', 'Air Conditioning', 'Room Service'],
          images: [property.images[0]],
          cancellation: 'Free cancellation until 24 hours before check-in',
          breakfast: true
        }
      ];
    }

    const rooms: any[] = [];
    const bedConfig = property.bedConfiguration;

    // Process bedrooms
    if (bedConfig.bedrooms && Array.isArray(bedConfig.bedrooms)) {
      bedConfig.bedrooms.forEach((bedroom: any, index: number) => {
        const bedsInRoom = bedroom.beds || [];
        const bedDescriptions: string[] = [];
        let totalBeds = 0;
        let maxGuests = 0;

        bedsInRoom.forEach((bed: any) => {
          if (bed.count > 0) {
            totalBeds += bed.count;
            bedDescriptions.push(`${bed.count} ${bed.type}`);
            
            // Calculate guest capacity based on bed type
            if (bed.type.includes('Single')) {
              maxGuests += bed.count * 1;
            } else if (bed.type.includes('Double') || bed.type.includes('King') || bed.type.includes('Queen') || bed.type.includes('Large bed')) {
              maxGuests += bed.count * 2;
            } else if (bed.type.includes('Bunk')) {
              maxGuests += bed.count * 2;
            } else if (bed.type.includes('Sofa')) {
              maxGuests += bed.count * 1;
            } else {
              maxGuests += bed.count * 1;
            }
          }
        });

        if (totalBeds > 0) {
          const priceMultiplier = index === 0 ? 1 : 1 + (index * 0.3);
          const roomPrice = Math.round(property.price * priceMultiplier);
          
          rooms.push({
            id: `bedroom-${index}`,
            name: bedroom.name || `Bedroom ${index + 1}`,
            bedroomName: bedroom.name || `Bedroom ${index + 1}`,
            size: property.propertySize || '25 sqm',
            beds: bedDescriptions.join(', '),
            guests: maxGuests || 2,
            price: roomPrice,
            originalPrice: roomPrice + 1000,
            amenities: property.amenities?.slice(0, 5) || ['Free WiFi', 'Air Conditioning'],
            images: [property.images[0] || 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'],
            cancellation: 'Free cancellation until 24 hours before check-in',
            breakfast: true,
            bedDetails: bedsInRoom.filter((b: any) => b.count > 0)
          });
        }
      });
    }

    // Process living room if has beds
    if (bedConfig.living_room?.beds) {
      const livingRoomBeds = bedConfig.living_room.beds.filter((b: any) => b.count > 0);
      if (livingRoomBeds.length > 0) {
        const bedDescriptions = livingRoomBeds.map((b: any) => `${b.count} ${b.type}`);
        const maxGuests = livingRoomBeds.reduce((sum: number, b: any) => {
          if (b.type.includes('Sofa')) return sum + b.count;
          return sum + (b.count * 2);
        }, 0);
        
        rooms.push({
          id: 'living-room',
          name: 'Living Room',
          bedroomName: 'Living Room',
          size: property.propertySize || '30 sqm',
          beds: bedDescriptions.join(', '),
          guests: maxGuests,
          price: Math.round(property.price * 0.8),
          originalPrice: Math.round(property.price * 0.8) + 800,
          amenities: ['Sofa Bed', 'TV', 'Free WiFi'],
          images: [property.images[1] || property.images[0]],
          cancellation: 'Free cancellation until 24 hours before check-in',
          breakfast: false,
          bedDetails: livingRoomBeds
        });
      }
    }

    // Process other spaces if has beds
    if (bedConfig.other_spaces && Array.isArray(bedConfig.other_spaces)) {
      bedConfig.other_spaces.forEach((space: any, index: number) => {
        const bedsInSpace = space.beds?.filter((b: any) => b.count > 0) || [];
        if (bedsInSpace.length > 0) {
          const bedDescriptions = bedsInSpace.map((b: any) => `${b.count} ${b.type}`);
          const maxGuests = bedsInSpace.reduce((sum: number, b: any) => {
            if (b.type.includes('Single')) return sum + b.count;
            if (b.type.includes('Double') || b.type.includes('King')) return sum + (b.count * 2);
            return sum + b.count;
          }, 0);
          
          rooms.push({
            id: `other-${index}`,
            name: space.name || `Additional Space ${index + 1}`,
            bedroomName: space.name || `Additional Space ${index + 1}`,
            size: '20 sqm',
            beds: bedDescriptions.join(', '),
            guests: maxGuests,
            price: Math.round(property.price * 0.7),
            originalPrice: Math.round(property.price * 0.7) + 600,
            amenities: ['Flexible Space', 'Free WiFi'],
            images: [property.images[2] || property.images[0]],
            cancellation: 'Free cancellation until 24 hours before check-in',
            breakfast: false,
            bedDetails: bedsInSpace
          });
        }
      });
    }

    // If no rooms generated, return default
    if (rooms.length === 0) {
      return [
        {
          id: 'default',
          name: 'Standard Room',
          bedroomName: 'Main Room',
          size: property.propertySize || '25 sqm',
          beds: `${property.bedrooms} Bedroom${property.bedrooms > 1 ? 's' : ''}`,
          guests: property.maxGuests,
          price: property.price,
          originalPrice: property.price + 1000,
          amenities: property.amenities?.slice(0, 5) || ['Free WiFi', 'Air Conditioning'],
          images: [property.images[0]],
          cancellation: 'Free cancellation until 24 hours before check-in',
          breakfast: true
        }
      ];
    }

    return rooms;
  };

  const rooms = generateRoomsFromBedConfig();
  const nights = calculateNights();

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
              <span className="text-sm font-medium text-gray-900 ml-1">{property.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500 ml-2">Excellent</span>
            </div>
            
            {/* Booking Details */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Your booking details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{bookingData.checkIn ? format(new Date(bookingData.checkIn), 'MMM dd, yyyy') : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{bookingData.checkOut ? format(new Date(bookingData.checkOut), 'MMM dd, yyyy') : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium">{bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}</span>
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

          {rooms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rooms available for the selected dates.</p>
            </div>
          ) : (
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

                        {/* Bed Details */}
                        {room.bedDetails && room.bedDetails.length > 0 && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-semibold text-blue-900 mb-2">Bed Configuration:</p>
                            <div className="space-y-1">
                              {room.bedDetails.map((bed: any, idx: number) => (
                                <div key={idx} className="flex items-center text-sm text-blue-800">
                                  <Bed className="h-3 w-3 mr-2" />
                                  <span>{bed.count} × {bed.type} ({bed.size})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Amenities */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity: string, index: number) => (
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
          )}
        </div>
      </div>
    </div>
  );
};

// Keep GuestDetails, PaymentDetails, and BookingConfirmation exactly as they were in the original code
const GuestDetails: React.FC<any> = ({ property, bookingData, selectedRoom, guestDetails, setGuestDetails, setCurrentStep, calculateNights }) => {
  const handleInputChange = (field: string, value: string) => {
    setGuestDetails((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (guestDetails.firstName && guestDetails.lastName && guestDetails.email && guestDetails.phone) {
      setCurrentStep(3);
    }
  };

  const nights = calculateNights();
  const roomTotal = selectedRoom ? selectedRoom.price * nights : 0;
  const taxes = Math.round(roomTotal * 0.18);

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
          We'll use these details to send you confirmation and updates about your booking
        </p>
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
                    placeholder="your.email@example.com"
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
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Country/Region
                </label>
                <select
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80"
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
                <span className="text-gray-600">Guests</span>
                <span className="font-semibold text-gray-900">{bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate</span>
                  <span className="font-semibold text-gray-900">₹{selectedRoom?.price.toLocaleString()}/night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-semibold text-gray-900">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="font-semibold text-gray-900">₹{taxes.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-blue-50 to-purple-50 -mx-4 px-4 py-4 rounded-xl">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">₹{(roomTotal + taxes).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentDetails: React.FC<any> = ({ 
  property, 
  bookingData, 
  selectedRoom, 
  paymentMethod, 
  setPaymentMethod, 
  cardDetails, 
  setCardDetails, 
  upiId, 
  setUpiId, 
  isProcessing, 
  handlePayment, 
  setCurrentStep,
  calculateNights,
  calculateTotal
}) => {
  const nights = calculateNights();
  const roomTotal = selectedRoom ? selectedRoom.price * nights : 0;
  const taxes = Math.round(roomTotal * 0.18);
  const total = calculateTotal();

  const handleCardInput = (field: string, value: string) => {
    if (field === 'number') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) return;
    }
    if (field === 'expiry') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }
    if (field === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 3) return;
    }
    setCardDetails((prev: any) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    if (paymentMethod === 'card') {
      return cardDetails.number.replace(/\s/g, '').length === 16 &&
             cardDetails.expiry.length === 5 &&
             cardDetails.cvv.length === 3 &&
             cardDetails.name.length > 0;
    } else if (paymentMethod === 'upi') {
      return upiId.length > 0 && upiId.includes('@');
    }
    return false;
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
              <label className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                paymentMethod === 'card' 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600 w-5 h-5"
                />
                <CreditCard className="h-6 w-6 ml-4 mr-3 text-gray-600" />
                <span className="font-semibold text-lg">Credit/Debit Card</span>
              </label>
              
              <label className={`flex items-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                paymentMethod === 'upi' 
                  ? 'bg-purple-50 border-purple-500' 
                  : 'hover:bg-purple-50 hover:border-purple-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-purple-600 w-5 h-5"
                />
                <Phone className="h-6 w-6 ml-4 mr-3 text-gray-600" />
                <span className="font-semibold text-lg">UPI</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Card Number *</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    value={cardDetails.number}
                    onChange={(e) => handleCardInput('number', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Expiry *</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                      value={cardDetails.expiry}
                      onChange={(e) => handleCardInput('expiry', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">CVV *</label>
                    <input
                      type="password"
                      placeholder="123"
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                      value={cardDetails.cvv}
                      onChange={(e) => handleCardInput('cvv', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Cardholder Name *</label>
                  <input
                    type="text"
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 uppercase"
                    value={cardDetails.name}
                    onChange={(e) => handleCardInput('name', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">UPI ID *</label>
                <input
                  type="text"
                  placeholder="yourname@paytm"
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !isFormValid()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:from-blue-700 hover:to-orange-600 font-semibold disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 sticky top-32">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Room × {nights} nights</span>
                <span className="font-semibold">₹{roomTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes (18%)</span>
                <span className="font-semibold">₹{taxes.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingConfirmation: React.FC<any> = ({ property, bookingData, selectedRoom, bookingId, navigate, calculateTotal }) => {
  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-8 shadow-2xl animate-bounce">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
          Booking Confirmed! 🎉
        </h1>
        <p className="text-2xl text-gray-600 mb-10">
          Your reservation at <span className="font-bold text-gray-900">{property.name}</span> has been confirmed.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/60 rounded-lg p-4">
              <span className="text-sm text-gray-600">Booking ID</span>
              <p className="font-bold text-blue-600 text-xl mt-1">{bookingId}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <span className="text-sm text-gray-600">Total Paid</span>
              <p className="font-bold text-green-600 text-xl mt-1">₹{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-orange-500 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-orange-600 font-bold"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/hotel-search')}
            className="border-2 border-blue-600 text-blue-600 py-4 px-8 rounded-xl hover:bg-blue-50 font-bold"
          >
            Search More
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;

