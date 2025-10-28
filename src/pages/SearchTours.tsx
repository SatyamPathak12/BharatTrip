import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Star, Clock, Users, Mountain, Filter, SlidersHorizontal, Play, Heart, Share2, Phone, Calendar, Search } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

interface Tour {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  images: string[];
  videos: string[];
  description: string;
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: { day: number; title: string; description: string }[];
  groupSize: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Wildlife' | 'Beach' | 'Heritage';
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

const SearchTours: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  // Get search parameters from URL or state
  const searchParams = new URLSearchParams(location.search);
  const [searchFilters, setSearchFilters] = useState({
    destination: searchParams.get('destination') || '',
    checkIn: searchParams.get('checkIn') || searchParams.get('date') || '',
    checkOut: searchParams.get('checkOut') || '',
    travelers: parseInt(searchParams.get('travelers') || '2'),
    category: searchParams.get('category') || 'all',
    priceRange: [5000, 50000],
    difficulty: 'all',
    duration: 'all'
  });

  // Mock tours data - in real app, this would come from API
  useEffect(() => {
    const mockTours: Tour[] = [
      {
        id: '1',
        title: 'Golden Triangle Heritage Tour',
        location: 'Delhi - Agra - Jaipur',
        duration: '6 Days / 5 Nights',
        price: 25000,
        originalPrice: 30000,
        rating: 4.8,
        reviews: 1247,
        images: [
          'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg',
          'https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg',
          'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg'
        ],
        videos: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
        description: 'Experience India\'s most iconic destinations in this comprehensive 6-day journey through the Golden Triangle.',
        highlights: ['Taj Mahal at Sunrise', 'Red Fort Delhi', 'Hawa Mahal Jaipur', 'Amber Fort', 'Local Markets', 'Traditional Cuisine'],
        includes: ['5-star Accommodation', 'All Meals', 'Private Transport', 'Expert Guide', 'Entry Tickets', 'Airport Transfers'],
        excludes: ['International Flights', 'Personal Expenses', 'Tips', 'Travel Insurance'],
        itinerary: [
          { day: 1, title: 'Arrival in Delhi', description: 'Airport pickup and check-in to hotel.' },
          { day: 2, title: 'Delhi Sightseeing', description: 'Full day tour of Old and New Delhi.' }
        ],
        groupSize: 'Max 15 people',
        difficulty: 'Easy',
        category: 'Cultural',
        createdBy: 'admin',
        createdAt: '2024-01-15',
        isActive: true
      },
      {
        id: '2',
        title: 'Kerala Backwaters & Hills',
        location: 'Kochi - Munnar - Alleppey',
        duration: '5 Days / 4 Nights',
        price: 18500,
        originalPrice: 22000,
        rating: 4.7,
        reviews: 892,
        images: [
          'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
          'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
          'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'
        ],
        videos: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'],
        description: 'Discover God\'s Own Country with this enchanting journey through Kerala\'s backwaters and hill stations.',
        highlights: ['Houseboat Stay', 'Tea Plantations', 'Spice Gardens', 'Backwater Cruise', 'Ayurvedic Spa', 'Traditional Cuisine'],
        includes: ['Houseboat Accommodation', 'All Meals', 'Transfers', 'Sightseeing', 'Ayurvedic Treatment'],
        excludes: ['Flights', 'Personal Expenses', 'Additional Activities'],
        itinerary: [
          { day: 1, title: 'Arrival in Kochi', description: 'Airport pickup and city tour.' },
          { day: 2, title: 'Kochi to Munnar', description: 'Drive to Munnar. Visit tea plantations.' }
        ],
        groupSize: 'Max 12 people',
        difficulty: 'Easy',
        category: 'Nature',
        createdBy: 'admin',
        createdAt: '2024-01-20',
        isActive: true
      },
      {
        id: '3',
        title: 'Rajasthan Desert Adventure',
        location: 'Jaisalmer - Jodhpur - Udaipur',
        duration: '7 Days / 6 Nights',
        price: 32000,
        originalPrice: 38000,
        rating: 4.9,
        reviews: 654,
        images: [
          'https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg',
          'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg',
          'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg'
        ],
        videos: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
        description: 'Embark on a royal journey through Rajasthan\'s desert cities with camel safaris and palace stays.',
        highlights: ['Camel Safari', 'Desert Camping', 'Palace Hotels', 'Folk Performances', 'Sunset Views', 'Local Crafts'],
        includes: ['Palace Accommodation', 'All Meals', 'Camel Safari', 'Cultural Shows', 'Transport'],
        excludes: ['Flights', 'Personal Shopping', 'Tips'],
        itinerary: [
          { day: 1, title: 'Arrival in Jaisalmer', description: 'Check-in to heritage hotel.' },
          { day: 2, title: 'Desert Safari', description: 'Full day desert experience with camel safari.' }
        ],
        groupSize: 'Max 10 people',
        difficulty: 'Moderate',
        category: 'Adventure',
        createdBy: 'admin',
        createdAt: '2024-01-25',
        isActive: true
      },
      {
        id: '4',
        title: 'Goa Beach Paradise',
        location: 'North & South Goa',
        duration: '4 Days / 3 Nights',
        price: 15000,
        originalPrice: 18000,
        rating: 4.6,
        reviews: 1156,
        images: [
          'https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg',
          'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
          'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'
        ],
        videos: ['https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'],
        description: 'Relax on pristine beaches, enjoy water sports, and experience Goa\'s vibrant nightlife.',
        highlights: ['Beach Hopping', 'Water Sports', 'Sunset Cruise', 'Portuguese Architecture', 'Local Cuisine', 'Night Markets'],
        includes: ['Beach Resort Stay', 'All Meals', 'Water Sports', 'Sunset Cruise', 'Transfers'],
        excludes: ['Flights', 'Alcohol', 'Personal Expenses'],
        itinerary: [
          { day: 1, title: 'Arrival in Goa', description: 'Airport pickup and beach resort check-in.' },
          { day: 2, title: 'North Goa Tour', description: 'Visit famous beaches and forts.' }
        ],
        groupSize: 'Max 20 people',
        difficulty: 'Easy',
        category: 'Beach',
        createdBy: 'admin',
        createdAt: '2024-01-30',
        isActive: true
      }
    ];

    setTimeout(() => {
      // Filter tours based on search criteria
      let filteredTours = mockTours.filter(tour => {
        const matchesDestination = !searchFilters.destination || 
          tour.location.toLowerCase().includes(searchFilters.destination.toLowerCase()) ||
          tour.title.toLowerCase().includes(searchFilters.destination.toLowerCase());
        
        const matchesCategory = searchFilters.category === 'all' || 
          tour.category.toLowerCase() === searchFilters.category.toLowerCase();
        
        const matchesPrice = tour.price >= searchFilters.priceRange[0] && 
          tour.price <= searchFilters.priceRange[1];
        
        const matchesDifficulty = searchFilters.difficulty === 'all' || 
          tour.difficulty.toLowerCase() === searchFilters.difficulty.toLowerCase();

        return matchesDestination && matchesCategory && matchesPrice && matchesDifficulty;
      });

      setTours(filteredTours);
      setLoading(false);
    }, 1000);
  }, [searchFilters]);

  const handleEnquiry = (tour: Tour) => {
    setSelectedTour(tour);
    setShowEnquiryModal(true);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header variant="page" />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for amazing tours...</p>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Tours in {searchFilters.destination || 'India'}
              </h1>
              <p className="text-gray-600">
                {searchFilters.checkIn && `${searchFilters.checkIn}${searchFilters.checkOut ? ` to ${searchFilters.checkOut}` : ''} · `}
                {searchFilters.travelers} traveler{searchFilters.travelers > 1 ? 's' : ''} · 
                {searchFilters.category !== 'all' ? ` ${searchFilters.category} tours` : ' All categories'}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range (per person)</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5000"
                    max="50000"
                    step="1000"
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

              {/* Tour Category */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Tour Category</h4>
                <div className="space-y-2">
                  {['All', 'Cultural', 'Adventure', 'Nature', 'Wildlife', 'Beach', 'Heritage'].map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.toLowerCase()}
                        checked={searchFilters.category === category.toLowerCase()}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Difficulty Level</h4>
                <div className="space-y-2">
                  {['All', 'Easy', 'Moderate', 'Challenging'].map((difficulty) => (
                    <label key={difficulty} className="flex items-center">
                      <input
                        type="radio"
                        name="difficulty"
                        value={difficulty.toLowerCase()}
                        checked={searchFilters.difficulty === difficulty.toLowerCase()}
                        onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Duration</h4>
                <div className="space-y-2">
                  {['All', '1-3 Days', '4-6 Days', '7+ Days'].map((duration) => (
                    <label key={duration} className="flex items-center">
                      <input
                        type="radio"
                        name="duration"
                        value={duration.toLowerCase()}
                        checked={searchFilters.duration === duration.toLowerCase()}
                        onChange={(e) => handleFilterChange('duration', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{duration}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="space-y-6">
              {tours.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tours found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                  <button
                    onClick={() => navigate('/tours')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Tours
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      {tours.length} tour{tours.length > 1 ? 's' : ''} found
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {tours.map((tour) => (
                      <TourCard key={tour.id} tour={tour} onEnquiry={handleEnquiry} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && selectedTour && (
        <EnquiryModal
          tour={selectedTour}
          onClose={() => setShowEnquiryModal(false)}
        />
      )}
    </div>
  );
};

// Tour Card Component
const TourCard: React.FC<{ tour: Tour; onEnquiry: (tour: Tour) => void }> = ({ tour, onEnquiry }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image/Video Section */}
      <div className="relative h-64">
        {!showVideo ? (
          <>
            <img
              src={tour.images[currentImageIndex]}
              alt={tour.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {tour.videos.length > 0 && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <Play className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <div className="relative">
            <video
              src={tour.videos[0]}
              controls
              className="w-full h-full object-cover"
              autoPlay
            />
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Image Navigation */}
        {tour.images.length > 1 && !showVideo && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {tour.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
            -{Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)}%
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            tour.category === 'Cultural' ? 'bg-purple-600 text-white' :
            tour.category === 'Adventure' ? 'bg-green-600 text-white' :
            tour.category === 'Nature' ? 'bg-blue-600 text-white' :
            tour.category === 'Beach' ? 'bg-orange-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {tour.category}
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

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{tour.title}</h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{tour.location}</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{tour.duration}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{tour.groupSize}</span>
              </div>
              <div className="flex items-center">
                <Mountain className="h-4 w-4 mr-1" />
                <span>{tour.difficulty}</span>
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="flex items-center mb-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900 ml-1">{tour.rating}</span>
              <span className="text-xs text-gray-500 ml-1">({tour.reviews})</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 line-through">₹{tour.originalPrice.toLocaleString()}</div>
              <div className="text-2xl font-bold text-gray-900">₹{tour.price.toLocaleString()}</div>
              <div className="text-sm text-gray-600">per person</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{tour.description}</p>

        {/* Highlights */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Tour Highlights:</h4>
          <div className="flex flex-wrap gap-1">
            {tour.highlights.slice(0, 4).map((highlight, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                {highlight}
              </span>
            ))}
            {tour.highlights.length > 4 && (
              <span className="text-xs text-green-600">+{tour.highlights.length - 4} more</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => onEnquiry(tour)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Phone className="h-4 w-4" />
            <span>Enquire Now</span>
          </button>
          <button className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium">
            <span onClick={() => navigate(`/tour-booking/${tour.id}`)}>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Enquiry Modal Component
const EnquiryModal: React.FC<{ tour: Tour; onClose: () => void }> = ({ tour, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    travelers: 2,
    preferredDate: '',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Enquiry submitted:', { tour: tour.id, ...formData });
    setShowSuccess(true);
    // Auto close after 3 seconds
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thank you for your enquiry! We will contact you soon with detailed information about your tour.
            </p>
            
            {/* Tour Reference */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Tour Enquiry:</p>
              <p className="font-semibold text-gray-900">{tour.title}</p>
              <p className="text-sm text-gray-600">{tour.location}</p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Browsing
            </button>
            
            {/* Auto close message */}
            <p className="text-xs text-gray-500 mt-3">
              This window will close automatically in 3 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Enquire About Tour</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tour Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={tour.images[0]}
                alt={tour.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-gray-900">{tour.title}</h3>
                <p className="text-sm text-gray-600">{tour.location}</p>
                <p className="text-sm text-gray-600">{tour.duration}</p>
                <p className="text-lg font-bold text-orange-600">₹{tour.price.toLocaleString()} per person</p>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Travelers</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Traveler' : 'Travelers'}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Travel Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Enquiry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchTours;