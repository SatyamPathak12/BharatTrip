import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Star, MapPin, Clock, Mountain, Filter, SlidersHorizontal, Play, Heart, Share2, Phone, Compass, Award, TrendingUp, Globe, Camera } from 'lucide-react';
import Header from '../components/Header';
import DatePicker from '../components/DatePicker';
import { useAuth } from '../context/AuthContext';
import { tourService, Tour } from '../lib/tourService';

const ToursPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState({
    destination: '',
    date: '',
    travelers: 2,
    category: 'all',
    difficulty: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tours from Supabase
  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching tours from Supabase...');
        const result = await tourService.getPublicTours();
        
        if (result.success && result.tours) {
          console.log('Tours fetched successfully:', result.tours.length);
          setTours(result.tours);
        } else {
          console.error('Failed to fetch tours:', result.error);
          setError(result.error || 'Failed to load tours');
          // Set empty array as fallback
          setTours([]);
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Failed to load tours. Please try again.');
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const handleSearch = () => {
    // Navigate to search tours with filters
    const searchParams = new URLSearchParams();
    if (searchData.destination) searchParams.set('destination', searchData.destination);
    if (searchData.date) searchParams.set('date', searchData.date);
    if (searchData.travelers) searchParams.set('travelers', searchData.travelers.toString());
    if (searchData.category !== 'all') searchParams.set('category', searchData.category);
    if (searchData.difficulty !== 'all') searchParams.set('difficulty', searchData.difficulty);
    
    navigate(`/search-tours?${searchParams.toString()}`);
  };

  const handleEnquiry = (tour: Tour) => {
    if (user) {
      // Navigate to tour booking
      navigate(`/tour-booking/${tour.id}`);
    } else {
      // Store the booking URL for after login
      sessionStorage.setItem('redirectAfterLogin', `/tour-booking/${tour.id}`);
      navigate('/login');
    }
  };

  const tourCategories = [
    { name: 'Cultural Tours', count: tours.filter(t => t.category === 'Cultural').length, icon: '🏛️', color: 'bg-purple-100 text-purple-800', category: 'Cultural' },
    { name: 'Adventure Tours', count: tours.filter(t => t.category === 'Adventure').length, icon: '🏔️', color: 'bg-green-100 text-green-800', category: 'Adventure' },
    { name: 'Nature Tours', count: tours.filter(t => t.category === 'Nature').length, icon: '🌿', color: 'bg-blue-100 text-blue-800', category: 'Nature' },
    { name: 'Wildlife Tours', count: tours.filter(t => t.category === 'Wildlife').length, icon: '🦁', color: 'bg-orange-100 text-orange-800', category: 'Wildlife' },
    { name: 'Beach Tours', count: tours.filter(t => t.category === 'Beach').length, icon: '🏖️', color: 'bg-cyan-100 text-cyan-800', category: 'Beach' },
    { name: 'Heritage Tours', count: tours.filter(t => t.category === 'Heritage').length, icon: '🏰', color: 'bg-red-100 text-red-800', category: 'Heritage' }
  ];

  const featuredTours = tours.filter(tour => tour.featured).slice(0, 6);
  const popularTours = tours.filter(tour => !tour.featured && tour.rating >= 4.5).slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="page" />
      
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-r from-green-600 to-blue-800 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Tours
            </h1>
            <p className="text-xl text-green-100">
              Explore incredible destinations with expertly crafted tour packages
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Where</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Destination, city, state..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    value={searchData.destination}
                    onChange={(e) => setSearchData({ ...searchData, destination: e.target.value })}
                  />
                </div>
              </div>

              {/* Travel Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">When</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    value={searchData.date}
                    onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Travelers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 appearance-none"
                    value={searchData.travelers}
                    onChange={(e) => setSearchData({ ...searchData, travelers: parseInt(e.target.value) })}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Traveler' : 'Travelers'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 appearance-none"
                  value={searchData.category}
                  onChange={(e) => setSearchData({ ...searchData, category: e.target.value })}
                >
                  <option value="all">All Categories</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Nature">Nature</option>
                  <option value="Wildlife">Wildlife</option>
                  <option value="Beach">Beach</option>
                  <option value="Heritage">Heritage</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="bg-orange-500 text-white py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Search Tours</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading amazing tours...</p>
            </div>
          </div>
        </section>
      )}

      {/* Error State */}
      {error && !loading && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Tours</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tour Categories */}
      {!loading && !error && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Browse by Tour Type
              </h2>
              <p className="text-lg text-gray-600">
                Find the perfect adventure for your travel style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tourCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group cursor-pointer hover:-translate-y-1 border border-gray-100"
                  onClick={() => {
                    const searchParams = new URLSearchParams();
                    searchParams.set('category', category.category.toLowerCase());
                    navigate(`/search-tours?${searchParams.toString()}`);
                  }}
                >
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                    {category.count} tour{category.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Tours */}
      {!loading && !error && featuredTours.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Featured Tours
                </h2>
                <p className="text-lg text-gray-600">
                  Handpicked premium tour experiences
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} onEnquiry={handleEnquiry} featured={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Tours */}
      {!loading && !error && popularTours.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular Tours
              </h2>
              <p className="text-lg text-gray-600">
                Highly rated tours loved by travelers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} onEnquiry={handleEnquiry} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Tours */}
      {!loading && !error && tours.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                All Tours
              </h2>
              <p className="text-lg text-gray-600">
                Explore our complete collection of tour packages
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.slice(0, 9).map((tour) => (
                <TourCard key={tour.id} tour={tour} onEnquiry={handleEnquiry} />
              ))}
            </div>

            {tours.length > 9 && (
              <div className="text-center mt-12">
                <button
                  onClick={() => navigate('/search-tours')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View All {tours.length} Tours
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && !error && tours.length === 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Compass className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Tours Available Yet</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                We're working on adding amazing tour packages. Check back soon or contact us for custom tour arrangements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/admin/tours')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create a Tour
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Explore Properties
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Our Tours */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Tours?
            </h2>
            <p className="text-lg text-gray-600">
              Experience the best of India with our expertly crafted tours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Guides</h3>
              <p className="text-gray-600">Local experts with deep knowledge of destinations</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Value</h3>
              <p className="text-gray-600">Competitive prices with no hidden costs</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentic Experiences</h3>
              <p className="text-gray-600">Immersive cultural and local experiences</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Highly Rated</h3>
              <p className="text-gray-600">Consistently excellent reviews from travelers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Tour Card Component
const TourCard: React.FC<{ tour: Tour; onEnquiry: (tour: Tour) => void; featured?: boolean }> = ({ 
  tour, 
  onEnquiry, 
  featured = false 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const defaultImage = 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg';
  const tourImages = tour.images && tour.images.length > 0 ? tour.images : [defaultImage];

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image/Video Section */}
      <div className="relative h-64">
        {!showVideo ? (
          <>
            <img
              src={tourImages[currentImageIndex]}
              alt={tour.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {tour.videos && tour.videos.length > 0 && (
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
              src={tour.videos?.[0]}
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
            {tourImages.map((_, index) => (
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
          {featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              FEATURED
            </span>
          )}
          {tour.discount_percentage && tour.discount_percentage > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              -{tour.discount_percentage}%
            </span>
          )}
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            tour.category === 'Cultural' ? 'bg-purple-600 text-white' :
            tour.category === 'Adventure' ? 'bg-green-600 text-white' :
            tour.category === 'Nature' ? 'bg-blue-600 text-white' :
            tour.category === 'Wildlife' ? 'bg-orange-600 text-white' :
            tour.category === 'Beach' ? 'bg-cyan-600 text-white' :
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
                <span>{tour.group_size}</span>
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
              <span className="text-xs text-gray-500 ml-1">({tour.reviews_count})</span>
            </div>
            <div className="text-right">
              {tour.original_price > tour.price && (
                <div className="text-sm text-gray-500 line-through">₹{tour.original_price.toLocaleString()}</div>
              )}
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
            {tour.highlights.slice(0, 3).map((highlight, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                {highlight}
              </span>
            ))}
            {tour.highlights.length > 3 && (
              <span className="text-xs text-green-600">+{tour.highlights.length - 3} more</span>
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
            <span>Book Now</span>
          </button>
          <button 
            onClick={() => {
              // Navigate to tour details or search with this tour's info
              const searchParams = new URLSearchParams();
              searchParams.set('destination', tour.location);
              searchParams.set('category', tour.category.toLowerCase());
              navigate(`/search-tours?${searchParams.toString()}`);
            }}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToursPage;