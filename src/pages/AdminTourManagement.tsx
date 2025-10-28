import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Upload, X, Save, MapPin, Clock, Users, Star, Camera, Video, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tourService, Tour, TourData, TourItineraryDay } from '../lib/tourService';

const AdminTourManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  // Fetch tours from database
  React.useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tourService.getAllTours();
      
      if (result.success && result.tours) {
        setTours(result.tours);
      } else {
        // If it's a table not found error, just show empty state
        if (result.error?.includes('relation "tours" does not exist')) {
          setTours([]);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch tours');
        }
      }
    } catch (err: any) {
      console.error('Error fetching tours:', err);
      setTours([]);
      setError(null); // Don't show error for missing table
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = () => {
    setEditingTour(null);
    setShowCreateModal(true);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setShowCreateModal(true);
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;
    
    try {
      const result = await tourService.deleteTour(tourId);
      
      if (result.success) {
        setTours(tours.filter(tour => tour.id !== tourId));
        alert('Tour deleted successfully');
      } else {
        alert(`Failed to delete tour: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert('Failed to delete tour');
    }
  };

  const handleSaveTour = async (tourData: TourData) => {
    try {
      if (editingTour) {
        // Update existing tour
        const result = await tourService.updateTour(editingTour.id, tourData);
        
        if (result.success && result.tour) {
          setTours(tours.map(t => t.id === editingTour.id ? result.tour! : t));
          setShowCreateModal(false);
          alert('Tour updated successfully');
        } else {
          alert(`Failed to update tour: ${result.error}`);
        }
      } else {
        // Create new tour
        const result = await tourService.createTour(tourData);
        
        if (result.success && result.tour) {
          setTours([result.tour, ...tours]);
          setShowCreateModal(false);
          alert('Tour created successfully');
        } else {
          alert(`Failed to create tour: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Failed to save tour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={fetchTours}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tours</h1>
            <p className="text-gray-600 mt-2">Create and manage your tour packages</p>
          </div>
          <button
            onClick={handleCreateTour}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Tour</span>
          </button>
        </div>

        {/* Tours Grid */}
        {tours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={tour.images[0] || 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg'}
                    alt={tour.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => handleEditTour(tour)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTour(tour.id)}
                      className="bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tour.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">₹{tour.price.toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tour.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tour.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tours created yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first tour package</p>
            <button
              onClick={handleCreateTour}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Tour
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <TourFormModal
            tour={editingTour}
            onClose={() => setShowCreateModal(false)}
            onSave={handleSaveTour}
          />
        )}
      </div>
    </div>
  );
};

// Tour Form Modal Component
const TourFormModal: React.FC<{
  tour: Tour | null;
  onClose: () => void;
  onSave: (tour: TourData) => void;
}> = ({ tour, onClose, onSave }) => {
  const [formData, setFormData] = useState<TourData>({
    title: tour?.title || '',
    location: tour?.location || '',
    duration: tour?.duration || '',
    price: tour?.price || 0,
    original_price: tour?.original_price || 0,
    description: tour?.description || '',
    images: tour?.images || [],
    videos: tour?.videos || [],
    highlights: tour?.highlights || [],
    includes: tour?.includes || [],
    excludes: tour?.excludes || [],
    itinerary: tour?.itinerary || [],
    group_size: tour?.group_size || '',
    difficulty: tour?.difficulty || 'Easy',
    category: tour?.category || 'Cultural',
    is_active: tour?.is_active ?? true,
    featured: tour?.featured || false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [newHighlight, setNewHighlight] = useState('');
  const [newInclude, setNewInclude] = useState('');
  const [newExclude, setNewExclude] = useState('');
  const [newItinerary, setNewItinerary] = useState<TourItineraryDay>({ 
    day: 1, 
    title: '', 
    description: '' 
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // Validation function for each step
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.push('Tour title is required');
        if (!formData.location.trim()) errors.push('Location is required');
        if (!formData.duration.trim()) errors.push('Duration is required');
        if (!formData.group_size.trim()) errors.push('Group size is required');
        if (!formData.description.trim()) errors.push('Description is required');
        if (formData.price <= 0) errors.push('Price must be greater than 0');
        if (formData.original_price <= 0) errors.push('Original price must be greater than 0');
        if (formData.price > formData.original_price) errors.push('Original price must be greater than or equal to current price');
        break;
      case 2:
        if (formData.images.length === 0) errors.push('At least one image is required');
        break;
      case 3:
        if (formData.highlights.length === 0) errors.push('At least one highlight is required');
        if (formData.includes.length === 0) errors.push('At least one inclusion is required');
        break;
      case 4:
        if (formData.itinerary.length === 0) errors.push('At least one itinerary day is required');
        break;
    }
    
    return errors;
  };

  // Handle image upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 5MB.`);
        return null;
      }

      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        return null;
      }

      try {
        const result = await tourService.uploadTourMedia(file);
        if (result.success && result.url) {
          return result.url;
        } else {
          alert(`Failed to upload ${file.name}: ${result.error}`);
          return null;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload ${file.name}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(url => url !== null) as string[];
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...successfulUploads]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Some images failed to upload. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingVideos(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // Validate file
      if (file.size > 50 * 1024 * 1024) {
        alert(`Video ${file.name} is too large. Maximum size is 50MB.`);
        return null;
      }

      if (!file.type.startsWith('video/')) {
        alert(`File ${file.name} is not a video.`);
        return null;
      }

      try {
        const result = await tourService.uploadTourMedia(file);
        if (result.success && result.url) {
          return result.url;
        } else {
          alert(`Failed to upload ${file.name}: ${result.error}`);
          return null;
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        alert(`Failed to upload ${file.name}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(url => url !== null) as string[];
      
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, ...successfulUploads]
      }));
    } catch (error) {
      console.error('Error uploading videos:', error);
      alert('Some videos failed to upload. Please try again.');
    } finally {
      setUploadingVideos(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Remove video
  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Handle next step
  const handleNext = () => {
    const errors = validateStep(currentStep);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setCurrentStep(currentStep + 1);
      setValidationErrors([]);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setValidationErrors([]);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps
    const allErrors: string[] = [];
    for (let step = 1; step <= 4; step++) {
      allErrors.push(...validateStep(step));
    }
    
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      alert('Please fix all validation errors before saving');
      return;
    }
    
    setSaving(true);
    setValidationErrors([]);
    onSave(formData);
    setSaving(false);
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData({
        ...formData,
        highlights: [...(formData.highlights || []), newHighlight.trim()]
      });
      setNewHighlight('');
    }
  };

  const addInclude = () => {
    if (newInclude.trim()) {
      setFormData({
        ...formData,
        includes: [...(formData.includes || []), newInclude.trim()]
      });
      setNewInclude('');
    }
  };

  const addExclude = () => {
    if (newExclude.trim()) {
      setFormData({
        ...formData,
        excludes: [...(formData.excludes || []), newExclude.trim()]
      });
      setNewExclude('');
    }
  };

  const addItinerary = () => {
    if (newItinerary.title.trim() && newItinerary.description.trim()) {
      setFormData({
        ...formData,
        itinerary: [...(formData.itinerary || []), newItinerary]
      });
      setNewItinerary({ day: (formData.itinerary?.length || 0) + 2, title: '', description: '' });
    }
  };

  const removeItem = (type: string, index: number) => {
    if (type === 'highlights') {
      setFormData({
        ...formData,
        highlights: formData.highlights?.filter((_, i) => i !== index)
      });
    } else if (type === 'includes') {
      setFormData({
        ...formData,
        includes: formData.includes?.filter((_, i) => i !== index)
      });
    } else if (type === 'excludes') {
      setFormData({
        ...formData,
        excludes: formData.excludes?.filter((_, i) => i !== index)
      });
    } else if (type === 'itinerary') {
      setFormData({
        ...formData,
        itinerary: formData.itinerary?.filter((_, i) => i !== index)
      });
    }
  };

  const isStepValid = (step: number): boolean => {
    return validateStep(step).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {tour ? 'Edit Tour Package' : 'Create New Tour Package'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-blue-600 text-white' : 
                  currentStep > step ? 'bg-green-600 text-white' : 
                  isStepValid(step) ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {(currentStep > step || isStepValid(step)) ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                <div className="ml-2 text-xs text-gray-600 hidden sm:block">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Media'}
                  {step === 3 && 'Details'}
                  {step === 4 && 'Itinerary'}
                </div>
                {step < 4 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tour Title *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter tour title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Delhi - Agra - Jaipur"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 5 Days / 4 Nights"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Size *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Max 15 people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.group_size}
                      onChange={(e) => setFormData({ ...formData, group_size: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      <option value="Cultural">Cultural</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Nature">Nature</option>
                      <option value="Wildlife">Wildlife</option>
                      <option value="Beach">Beach</option>
                      <option value="Heritage">Heritage</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Challenging">Challenging</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      placeholder="Enter tour price"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: parseInt(e.target.value) || 0 })}
                      placeholder="Enter original price"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the tour experience..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Media Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Images & Videos</h3>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tour Images *</label>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Tour Images</h4>
                    <p className="text-gray-600 mb-4">Add high-quality images to showcase your tour</p>
                    
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Upload className="h-5 w-5" />
                      <span>{uploadingImages ? 'Uploading...' : 'Choose Images'}</span>
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum 5MB per image. Supported formats: JPG, PNG, WEBP
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {uploadingImages && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-800 font-medium">Uploading images...</span>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Images */}
                  {formData.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Uploaded Images ({formData.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Tour ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-1 left-1 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                Cover
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Video Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tour Videos (Optional)</label>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors mb-4">
                    <input
                      ref={videoInputRef}
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e.target.files)}
                      className="hidden"
                    />
                    
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Tour Videos</h4>
                    <p className="text-gray-600 mb-4">Add videos to give travelers a preview of the tour</p>
                    
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideos}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Upload className="h-5 w-5" />
                      <span>{uploadingVideos ? 'Uploading...' : 'Choose Videos'}</span>
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum 50MB per video. Supported formats: MP4, WEBM, MOV
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {uploadingVideos && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-purple-800 font-medium">Uploading videos...</span>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Videos */}
                  {formData.videos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Uploaded Videos ({formData.videos.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.videos.map((videoUrl, index) => (
                          <div key={index} className="relative group">
                            <video
                              src={videoUrl}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Details</h3>
                
                {/* Highlights */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tour Highlights *</label>
                  <div className="space-y-2">
                    {formData.highlights?.map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg">{highlight}</span>
                        <button
                          type="button"
                          onClick={() => removeItem('highlights', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add highlight"
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                      />
                      <button
                        type="button"
                        onClick={addHighlight}
                        disabled={!newHighlight.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Includes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What's Included *</label>
                  <div className="space-y-2">
                    {formData.includes?.map((include, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 px-3 py-2 bg-green-50 rounded-lg">{include}</span>
                        <button
                          type="button"
                          onClick={() => removeItem('includes', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add inclusion"
                        value={newInclude}
                        onChange={(e) => setNewInclude(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclude())}
                      />
                      <button
                        type="button"
                        onClick={addInclude}
                        disabled={!newInclude.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Excludes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What's Not Included</label>
                  <div className="space-y-2">
                    {formData.excludes?.map((exclude, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 px-3 py-2 bg-red-50 rounded-lg">{exclude}</span>
                        <button
                          type="button"
                          onClick={() => removeItem('excludes', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add exclusion"
                        value={newExclude}
                        onChange={(e) => setNewExclude(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclude())}
                      />
                      <button
                        type="button"
                        onClick={addExclude}
                        disabled={!newExclude.trim()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Itinerary */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Itinerary *</h3>
                
                <div className="space-y-4">
                  {formData.itinerary?.map((day, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Day {day.day}: {day.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem('itinerary', index)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border border-dashed border-gray-300 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newItinerary.day}
                          onChange={(e) => setNewItinerary({ ...newItinerary, day: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Day title"
                          value={newItinerary.title}
                          onChange={(e) => setNewItinerary({ ...newItinerary, title: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Day description"
                          value={newItinerary.description}
                          onChange={(e) => setNewItinerary({ ...newItinerary, description: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <button
                          type="button"
                          onClick={addItinerary}
                          disabled={!newItinerary.title.trim() || !newItinerary.description.trim()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Day
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Tour is active
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                      Mark as featured tour
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Next</span>
                    {isStepValid(currentStep) && <CheckCircle className="h-4 w-4" />}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving || !isStepValid(4)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Tour</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTourManagement;