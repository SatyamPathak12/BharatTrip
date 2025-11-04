
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Home, 
  Hotel, 
  TreePine, 
  Upload, 
  X, 
  CheckCircle,
  Camera,
  Plus,
  Trash2,
  Eye,
  Star,
  Wifi,
  Car,
  Coffee,
  Waves,
  Dumbbell,
  Wind,
  Tv,
  Users,
  Bed,
  Bath,
  Square,
  DollarSign,
  FileText,
  Shield,
  Clock,
  CreditCard,
  Phone,
  Mail,
  User,
  Calendar,
  Globe,
  Award,
  Heart,
  Share2,
  Mountain,
  Tent,
  Ship,
  Castle,
  ChevronRight,
  Play,
  Minus,
  Sparkles,
  Sun,
  Utensils,
  Droplet,
  Box,
  Droplets,
  Wine,
  Gamepad2,
  Trees,
  Umbrella,
  UtensilsCrossed,
  Printer,
  Plug,
  Plug2
} from 'lucide-react';
import Header from '../components/Header';
import DocumentUpload from '../components/DocumentUpload';
import { useAuth } from '../context/AuthContext';
import { propertyService, PropertyData } from '../lib/propertyService';
import { supabase } from '../lib/supabase';
import { ChevronDown } from 'lucide-react';
import { propertyLimitsService } from '../lib/propertyLimitsService';

// ============================================
// STORAGE HELPERS
// ============================================
const STORAGE_KEYS = {
  CURRENT_STEP: 'propertyListing_currentStep',
  FORM_DATA: 'propertyListing_formData',
  PROPERTY_FLOW: 'propertyListing_propertyFlow',
  UPLOADED_IMAGES: 'propertyListing_uploadedImages',
  UPLOADED_DOCUMENTS: 'propertyListing_uploadedDocuments',
  COVER_IMAGE_INDEX: 'propertyListing_coverImageIndex',
};

const SESSION_KEY = 'activeListingSession';

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

const isActiveSession = () => {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
};

const setActiveSession = () => {
  sessionStorage.setItem(SESSION_KEY, 'true');
};

// ============================================
// MAIN COMPONENT
// ============================================
const PropertyListingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ============================================
  // STATE WITH PERSISTENCE
  // ============================================
  const [currentStep, setCurrentStep] = useState<string>('entry');
  const [shouldLoadProgress, setShouldLoadProgress] = useState(false);

  const [propertyFlow, setPropertyFlow] = useState({
    mainCategory: '',
    subCategory: '',
    roomType: '',
    isMultiple: false,
    numberOfProperties: 1
  });

  const [formData, setFormData] = useState({
    propertyType: '',
    name: '',
    description: '',
    location: '',
    address: '',
    post_code: '',
    maxGuests: 1,
    bedrooms: 1,
    bathrooms: 1,
    propertySize: '',
    sizeUnit: 'sqft',
    bed_configuration: null as any,
    allowChildren: true,
    offerCots: true,
    amenities: [] as string[],
    pricePerNight: 1000,
    cleaningFee: 0,
    securityDeposit: 0,
    weeklyDiscount: 0,
    monthlyDiscount: 0,
    freeCancellationDays: 1,
    accidentalBookingProtection: true,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    smokingAllowed: false,
    partiesAllowed: false,
    petsPolicy: 'upon-request' as 'yes' | 'upon-request' | 'no',
    petCharges: 'free' as 'free' | 'charges-apply',
    checkInFrom: '15:00',
    checkInUntil: '18:00',
    checkOutFrom: '08:00',
    checkOutUntil: '11:00',
    checkInTime: '3:00 PM',
    checkOutTime: '11:00 AM',
    minimumStay: 1,
    cancellationPolicy: 'Flexible cancellation up to 24 hours before check-in',
    nearbyAttractions: [] as string[],
    propertyRules: [] as string[],
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ============================================
  // INITIAL LOAD - Check session and load data
  // ============================================
  useEffect(() => {
    const hasActiveSession = isActiveSession();
    const savedStep = loadFromStorage(STORAGE_KEYS.CURRENT_STEP);
    
    if (hasActiveSession && savedStep && savedStep !== 'entry' && savedStep !== 'success') {
      // Active session exists - load all saved data
      setCurrentStep(savedStep);
      setPropertyFlow(loadFromStorage(STORAGE_KEYS.PROPERTY_FLOW, {
        mainCategory: '',
        subCategory: '',
        roomType: '',
        isMultiple: false,
        numberOfProperties: 1
      }));
      setFormData(loadFromStorage(STORAGE_KEYS.FORM_DATA, formData));
      setUploadedImages(loadFromStorage(STORAGE_KEYS.UPLOADED_IMAGES, []));
      setUploadedDocuments(loadFromStorage(STORAGE_KEYS.UPLOADED_DOCUMENTS, []));
      setCoverImageIndex(loadFromStorage(STORAGE_KEYS.COVER_IMAGE_INDEX, null));
    } else {
      // No active session - start fresh at entry
      setCurrentStep('entry');
      clearSession();
    }
  }, []);

  // ============================================
  // AUTO-SAVE TO LOCALSTORAGE
  // ============================================
  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.CURRENT_STEP, currentStep);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.PROPERTY_FLOW, propertyFlow);
    }
  }, [propertyFlow, currentStep]);

  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.FORM_DATA, formData);
    }
  }, [formData, currentStep]);

  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.UPLOADED_IMAGES, uploadedImages);
    }
  }, [uploadedImages, currentStep]);

  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.UPLOADED_DOCUMENTS, uploadedDocuments);
    }
  }, [uploadedDocuments, currentStep]);

  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      saveToStorage(STORAGE_KEYS.COVER_IMAGE_INDEX, coverImageIndex);
    }
  }, [coverImageIndex, currentStep]);

  // ============================================
  // SESSION MANAGEMENT
  // ============================================
  useEffect(() => {
    if (currentStep !== 'entry' && currentStep !== 'success') {
      setActiveSession();
    }
  }, [currentStep]);

  // ============================================
  // AUTH CHECK
  // ============================================
  React.useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !user) {
        navigate('/login');
        return;
      }
      
      setAuthLoading(false);
    };
    
    checkAuth();
  }, [user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ============================================
  // NAVIGATION FUNCTIONS
  // ============================================
  const goToBasicInfo = () => {
    let finalType = '';
    
    if (propertyFlow.mainCategory === 'apartment') {
      finalType = 'apartment';
    } else if (propertyFlow.mainCategory === 'homes') {
      if (propertyFlow.roomType === 'entire_place') {
        finalType = propertyFlow.subCategory;
      } else {
        finalType = propertyFlow.subCategory;
      }
    } else if (propertyFlow.mainCategory === 'hotels') {
      finalType = propertyFlow.subCategory;
    } else if (propertyFlow.mainCategory === 'alternative') {
      finalType = propertyFlow.subCategory;
    }
    
    setFormData(prev => ({ ...prev, propertyType: finalType }));
    setCurrentStep('basic_info');
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let validRoomType: 'entire_place' | 'private_room' | null = null;
      
      if (propertyFlow.roomType === 'entire_place') {
        validRoomType = 'entire_place';
      } else if (propertyFlow.roomType === 'private_room') {
        validRoomType = 'private_room';
      }

      const propertyData: PropertyData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        post_code: formData.post_code,
        property_type: formData.propertyType as any,
        max_guests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        property_size: formData.propertySize,
        size_unit: formData.sizeUnit || 'sqft',
        bed_configuration: formData.bed_configuration || null,
        allow_children: formData.allowChildren !== undefined ? formData.allowChildren : true,
        offer_cots: formData.offerCots !== undefined ? formData.offerCots : true,
        amenities: formData.amenities || [],
        images: uploadedImages,
        price_per_night: formData.pricePerNight,
        cleaning_fee: formData.cleaningFee || 0,
        security_deposit: formData.securityDeposit || 0,
        weekly_discount: formData.weeklyDiscount || 0,
        monthly_discount: formData.monthlyDiscount || 0,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        smoking_allowed: formData.smokingAllowed || false,
        parties_allowed: formData.partiesAllowed || false,
        pets_policy: formData.petsPolicy || 'upon-request',
        pet_charges: formData.petCharges || 'free',
        check_in_from: formData.checkInFrom || '15:00',
        check_in_until: formData.checkInUntil || '18:00',
        check_out_from: formData.checkOutFrom || '08:00',
        check_out_until: formData.checkOutUntil || '11:00',
        check_in_time: formData.checkInTime || '3:00 PM',
        check_out_time: formData.checkOutTime || '11:00 AM',
        free_cancellation_days: formData.freeCancellationDays || 1,
        accidental_booking_protection: formData.accidentalBookingProtection !== undefined 
          ? formData.accidentalBookingProtection 
          : true,
        cancellation_policy: formData.cancellationPolicy || 'Flexible cancellation up to 24 hours before check-in',
        nearby_attractions: formData.nearbyAttractions || [], 
        property_rules: formData.propertyRules || [],
        minimum_stay: formData.minimumStay || 1,
        instant_book: false,
        documents: uploadedDocuments,
        main_category: propertyFlow.mainCategory,
        sub_category: propertyFlow.subCategory,
        room_type: validRoomType,
        is_multiple: propertyFlow.isMultiple || false,
        number_of_properties: propertyFlow.numberOfProperties || 1,
        is_same_location: propertyFlow.isSameLocation,
        is_multiple_properties: propertyFlow.isMultiple || false,
        property_count: propertyFlow.numberOfProperties || 1,
        same_address: propertyFlow.isSameLocation,
        listing_type: propertyFlow.isMultiple 
          ? (propertyFlow.isSameLocation ? 'multiple_same_address' : 'multiple_different_address')
          : 'single'
      };

      console.log('Submitting property data:', propertyData);

      const result = await propertyService.createProperty(propertyData);
      
      if (result.success && result.property) {
        setPropertyId(result.property.id);
        clearStorage();
        clearSession();
        setCurrentStep('success');
      } else {
        alert(`Failed to create property: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating property:', error);
      alert('An error occurred while creating the property');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // IMAGE UPLOAD
  // ============================================
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // ============================================
  // RENDER STEPS
  // ============================================
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'entry':
        return <EntryPointStep 
          onNext={(action) => {
            if (action === 'get_started') {
              // Clear everything and start fresh
              clearStorage();
              clearSession();
              setActiveSession();
              
              // Reset all state
              setPropertyFlow({
                mainCategory: '',
                subCategory: '',
                roomType: '',
                isMultiple: false,
                numberOfProperties: 1
              });
              
              setFormData({
                propertyType: '',
                name: '',
                description: '',
                location: '',
                address: '',
                post_code: '',
                maxGuests: 1,
                bedrooms: 1,
                bathrooms: 1,
                propertySize: '',
                sizeUnit: 'sqft',
                bed_configuration: null,
                allowChildren: true,
                offerCots: true,
                amenities: [],
                pricePerNight: 1000,
                cleaningFee: 0,
                securityDeposit: 0,
                weeklyDiscount: 0,
                monthlyDiscount: 0,
                freeCancellationDays: 1,
                accidentalBookingProtection: true,
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                smokingAllowed: false,
                partiesAllowed: false,
                petsPolicy: 'upon-request',
                petCharges: 'free',
                checkInFrom: '15:00',
                checkInUntil: '18:00',
                checkOutFrom: '08:00',
                checkOutUntil: '11:00',
                checkInTime: '3:00 PM',
                checkOutTime: '11:00 AM',
                minimumStay: 1,
                cancellationPolicy: 'Flexible cancellation up to 24 hours before check-in',
                propertyRules: [],
              });
              
              setUploadedImages([]);
              setUploadedDocuments([]);
              setCoverImageIndex(null);
              
              setCurrentStep('property_categories');
            } else {
              // Continue - load saved progress
              setActiveSession();
              const savedStep = loadFromStorage(STORAGE_KEYS.CURRENT_STEP);
              if (savedStep && savedStep !== 'entry' && savedStep !== 'success') {
                // Load all saved data
                setPropertyFlow(loadFromStorage(STORAGE_KEYS.PROPERTY_FLOW, propertyFlow));
                setFormData(loadFromStorage(STORAGE_KEYS.FORM_DATA, formData));
                setUploadedImages(loadFromStorage(STORAGE_KEYS.UPLOADED_IMAGES, []));
                setUploadedDocuments(loadFromStorage(STORAGE_KEYS.UPLOADED_DOCUMENTS, []));
                setCoverImageIndex(loadFromStorage(STORAGE_KEYS.COVER_IMAGE_INDEX, null));
                setCurrentStep(savedStep);
              } else {
                setCurrentStep('property_categories');
              }
            }
          }}
          hasSavedProgress={(() => {
            const savedStep = loadFromStorage(STORAGE_KEYS.CURRENT_STEP);
            return savedStep && savedStep !== 'entry' && savedStep !== 'success';
          })()}
        />;
      
      case 'property_categories':
        return <PropertyCategoriesStep 
          onNext={(category) => {
            setPropertyFlow(prev => ({ ...prev, mainCategory: category }));
            setCurrentStep(`${category}_flow`);
          }}
          onBack={() => {
            clearStorage();
            clearSession();
            setCurrentStep('entry');
          }}
        />;
      
      case 'apartment_flow':
        return <ApartmentFlowStep 
          propertyFlow={propertyFlow}
          setPropertyFlow={setPropertyFlow}
          onNext={goToBasicInfo}
          onBack={() => setCurrentStep('property_categories')}
        />;
      
      case 'homes_flow':
        return <HomesFlowStep 
          propertyFlow={propertyFlow}
          setPropertyFlow={setPropertyFlow}
          onNext={goToBasicInfo}
          onBack={() => setCurrentStep('property_categories')}
        />;
      
      case 'hotels_flow':
        return <HotelsFlowStep 
          propertyFlow={propertyFlow}
          setPropertyFlow={setPropertyFlow}
          onNext={goToBasicInfo}
          onBack={() => setCurrentStep('property_categories')}
        />;
      
      case 'alternative_flow':
        return <AlternativeFlowStep 
          propertyFlow={propertyFlow}
          setPropertyFlow={setPropertyFlow}
          onNext={goToBasicInfo}
          onBack={() => setCurrentStep('property_categories')}
        />;
      
      case 'basic_info':
        return <BasicInfoStep 
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep('details')}
          onBack={() => setCurrentStep('property_categories')}
        />;
      
      case 'details':
        return <DetailsStep 
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep('amenities')}
          onBack={() => setCurrentStep('basic_info')}
        />;
      
      case 'amenities':
        return <AmenitiesStep 
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep('photos')}
          onBack={() => setCurrentStep('details')}
        />;
      
      case 'photos':
        return <PhotosStep 
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          uploadingImages={uploadingImages}
          setUploadingImages={setUploadingImages}
          uploadImage={uploadImage}
          onNext={() => setCurrentStep('pricing')}
          onBack={() => setCurrentStep('amenities')}
          coverImageIndex={coverImageIndex}
          setCoverImageIndex={setCoverImageIndex}
        />;
      
      case 'pricing':
        return <PricingStep 
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep('policies')}
          onBack={() => setCurrentStep('photos')}
        />;
      
      case 'policies':
        return <PoliciesStep 
          formData={formData}
          setFormData={setFormData}
          onNext={() => setCurrentStep('documents')}
          onBack={() => setCurrentStep('pricing')}
        />;
      
      case 'documents':
        return <DocumentsStep 
          uploadedDocuments={uploadedDocuments}
          setUploadedDocuments={setUploadedDocuments}
          onNext={() => setCurrentStep('review')}
          onBack={() => setCurrentStep('policies')}
        />;
      
      case 'review':
        return <ReviewStep 
          formData={formData}
          uploadedImages={uploadedImages}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onBack={() => setCurrentStep('documents')}
        />;
      
      case 'success':
        return <SuccessStep propertyId={propertyId} />;
      
      default:
        return <EntryPointStep 
          onNext={(action) => {
            if (action === 'get_started') {
              clearStorage();
              clearSession();
              setActiveSession();
              setCurrentStep('property_categories');
            } else {
              setActiveSession();
              const savedStep = loadFromStorage(STORAGE_KEYS.CURRENT_STEP);
              if (savedStep && savedStep !== 'entry' && savedStep !== 'success') {
                setPropertyFlow(loadFromStorage(STORAGE_KEYS.PROPERTY_FLOW, propertyFlow));
                setFormData(loadFromStorage(STORAGE_KEYS.FORM_DATA, formData));
                setUploadedImages(loadFromStorage(STORAGE_KEYS.UPLOADED_IMAGES, []));
                setUploadedDocuments(loadFromStorage(STORAGE_KEYS.UPLOADED_DOCUMENTS, []));
                setCoverImageIndex(loadFromStorage(STORAGE_KEYS.COVER_IMAGE_INDEX, null));
                setCurrentStep(savedStep);
              } else {
                setCurrentStep('property_categories');
              }
            }
          }} 
          hasSavedProgress={false} 
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Header variant="page" />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep !== 'entry' && currentStep !== 'success' && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
          )}

          <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ALL YOUR EXISTING STEP COMPONENTS BELOW
// Only SuccessStep needs to be updated
// ============================================

// Entry Point Step - KEEP YOUR EXISTING CODE
const EntryPointStep: React.FC<{ onNext: (action: string) => void; hasSavedProgress: boolean }> = ({ onNext, hasSavedProgress }) => {
  return (
    <div className="text-center space-y-8">
      <div>
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full mb-6 shadow-lg">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">List Your Property</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Join thousands of hosts earning money by sharing their space with travelers from around the world
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => onNext('get_started')}
          className="group p-8 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-2xl hover:from-blue-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <div className="text-center">
            <Play className="h-12 w-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">Get Started Now</h3>
            <p className="text-blue-100">Begin listing your property</p>
          </div>
        </button>

       <button
  onClick={() => onNext('continue')}
  disabled={!hasSavedProgress}
  className={`group p-8 rounded-2xl transition-all duration-300 transform shadow-lg ${
    hasSavedProgress
      ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 hover:shadow-xl cursor-pointer'
      : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
  }`}
>
  <div className="text-center">
    <FileText className={`h-12 w-12 mx-auto mb-4 transition-all ${
      hasSavedProgress
        ? 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110'
        : 'text-gray-400'
    }`} />
    <h3 className="text-2xl font-bold mb-2">Continue Registration</h3>
    <p className={hasSavedProgress ? 'text-gray-500' : 'text-gray-400'}>
      {hasSavedProgress ? 'Resume your listing process' : 'No saved progress found'}
    </p>
  </div>
</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-3xl mx-auto">
        <h4 className="font-semibold text-blue-900 mb-3">Why list with BharatTrips?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-blue-800">Reach millions of travelers</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-blue-800">Secure payment processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-blue-800">24/7 host support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Property Categories Step
const PropertyCategoriesStep: React.FC<{ 
  onNext: (category: string) => void; 
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  const categories = [
    {
      id: 'apartment',
      title: 'Apartment',
      description: 'Furnished apartments and flats',
      icon: Building2,
      color: 'from-blue-600 to-blue-700'
    },
    {
      id: 'homes',
      title: 'Homes',
      description: 'Houses, villas, and private rooms',
      icon: Home,
      color: 'from-green-600 to-green-700'
    },
    {
      id: 'hotels',
      title: 'Hotels & B&Bs',
      description: 'Commercial accommodations',
      icon: Hotel,
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'alternative',
      title: 'Alternative Places',
      description: 'Unique and unconventional stays',
      icon: Tent,
      color: 'from-orange-600 to-orange-700'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What type of property do you want to list?</h2>
        <p className="text-lg text-gray-600">Choose the category that best describes your property</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onNext(category.id)}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left"
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${category.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
              <category.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
            <p className="text-gray-600">{category.description}</p>
            <div className="flex items-center mt-4 text-blue-600 group-hover:text-blue-700">
              <span className="font-medium">Select</span>
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onBack}
           className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back to start
        </button>
      </div>
    </div>
  );
};

// Apartment Flow Step
const ApartmentFlowStep: React.FC<{
  propertyFlow: any;
  setPropertyFlow: any;
  onNext: () => void;
  onBack: () => void;
}> = ({ propertyFlow, setPropertyFlow, onNext, onBack }) => {
  const [step, setStep] = useState(1);
  const [sameLocation, setSameLocation] = useState<boolean | null>(null);

  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Apartment Listing
          </h2>
          <p className="text-lg text-gray-600">
            How many apartments are you listing?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* One Apartment */}
          <button
            onClick={() => {
              setPropertyFlow((prev: any) => ({
                ...prev,
                isMultiple: false,
                numberOfProperties: 1,
                subCategory: "apartment",
              }));
              onNext();
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                One Apartment
              </h3>
              <p className="text-gray-600">List a single apartment</p>
            </div>
          </button>

          {/* Multiple Apartments */}
          <button
            onClick={() => {
              setStep(2);
              setPropertyFlow((prev: any) => ({
                ...prev,
                isMultiple: true,
                numberOfProperties: prev.numberOfProperties || 1,
                subCategory: "apartment",
              }));
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Multiple Apartments
              </h3>
              <p className="text-gray-600">List multiple apartments</p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
          >
            Back to categories
          </button>
        </div>
      </div>
    );
  }


  // Step 2: Multiple Apartments
 return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Are these properties in the same address or building?
        </h2>
      </div>

      {/* Yes Option */}
      <button
        onClick={() => setSameLocation(true)}
        className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
          sameLocation === true
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-300"
        }`}
      >
        <div className="flex-shrink-0">
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <div className="text-left flex-grow">
          <div className="font-medium text-gray-900">
            Yes, these apartments are at the same address or building
          </div>
        </div>
        {sameLocation === true && (
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </button>

      {/* No Option */}
      <button
        onClick={() => setSameLocation(false)}
        className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
          sameLocation === false
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-300"
        }`}
      >
        <div className="flex-shrink-0">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div className="text-left flex-grow">
          <div className="font-medium text-gray-900">
            No, these apartments are at different addresses or buildings
          </div>
        </div>
        {sameLocation === false && (
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
        )}
      </button>

      {/* Number of Properties Input */}
      <div className="mt-10">
        <label className="block text-lg font-medium text-gray-900 mb-3">
          Number of properties
        </label>
        <input
          type="number"
          min="2"
          value={propertyFlow.numberOfProperties}
          onChange={(e) =>
            setPropertyFlow((prev: any) => ({
              ...prev,
              numberOfProperties: Math.max(2, parseInt(e.target.value) || 2),
            }))
          }
          className="w-40 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-8">

        
        <button
          onClick={() => setStep(1)}
           className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
           Back
        </button>
        <button
          onClick={() => {
            if (sameLocation !== null) {
              setPropertyFlow((prev: any) => ({
                ...prev,
                isMultiple: true,
                subCategory: "apartment",
                isSameLocation: sameLocation,
              }));
              onNext();
            }
          }}
          disabled={sameLocation === null}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            sameLocation === null
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};


// Homes Flow Step
const HomesFlowStep: React.FC<{
  propertyFlow: any;
  setPropertyFlow: any;
  onNext: () => void;
  onBack: () => void;
}> = ({ propertyFlow, setPropertyFlow, onNext, onBack }) => {
  const [step, setStep] = useState(1);
  const [propertyCount, setPropertyCount] = useState(2);
  const [guestHouseType, setGuestHouseType] = useState<'single' | 'multiple' | null>(null);

  // Helper function to get subcategory display name
  const getSubCategoryName = () => {
    const allTypes = [
      // Entire Place
      { id: "apartment", title: "Apartment", singular: "apartment", plural: "apartments" },
      { id: "holiday_home", title: "Holiday Home", singular: "holiday home", plural: "holiday homes" },
      { id: "villa", title: "Villa", singular: "villa", plural: "villas" },
      { id: "chalet", title: "Chalet", singular: "chalet", plural: "chalets" },
      { id: "resort", title: "Holiday Park", singular: "holiday park", plural: "holiday parks" },
      { id: "hotel", title: "Aparthotel", singular: "aparthotel", plural: "aparthotels" },
      // Private Room
      { id: "guest_house", title: "Guest House", singular: "guest house", plural: "guest houses" },
      { id: "bnb", title: "Bed and Breakfast", singular: "bed & breakfast", plural: "bed and breakfasts" },
      { id: "homestay", title: "Homestay", singular: "homestay", plural: "homestays" },
      { id: "country_house", title: "Country House", singular: "country house", plural: "country houses" },
      { id: "aparthotel", title: "Aparthotel", singular: "aparthotel", plural: "aparthotels" },
      { id: "farmstay", title: "Farm Stay", singular: "farm stay", plural: "farm stays" },
      { id: "lodge", title: "Lodge", singular: "lodge", plural: "lodges" },
    ];
    
    const selected = allTypes.find(type => type.id === propertyFlow.subCategory);
    return selected || { id: 'property', title: 'Property', singular: 'property', plural: 'properties' };
  };

  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-xl mb-4">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Homes</h2>
          <p className="text-lg text-gray-600">What are you offering to guests?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => {
              setPropertyFlow((prev: any) => ({ ...prev, roomType: "entire_place" }));
              setStep(2);
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-green-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Entire Place</h3>
              <p className="text-gray-600">Guests have the whole place to themselves</p>
            </div>
          </button>

          <button
            onClick={() => {
              setPropertyFlow((prev: any) => ({ ...prev, roomType: "private_room" }));
              setStep(3);
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Bed className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Private Room</h3>
              <p className="text-gray-600">Guests have a private room in your home</p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const entirePlaceTypes = [
      { id: "apartment", title: "Apartment", description: "Furnished & self-catering rental" },
      { id: "holiday_home", title: "Holiday Home", description: "Free-standing, external entrance, rented for holidays" },
      { id: "villa", title: "Villa", description: "Private, luxury self-standing home" },
      { id: "chalet", title: "Chalet", description: "Sloped roof, holiday rental" },
      { id: "resort", title: "Holiday Park", description: "Residences with shared facilities" },
      { id: "hotel", title: "Aparthotel", description: "Self-catering apartment with hotel facilities" },
    ];

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Entire Place Categories</h2>
          <p className="text-lg text-gray-600">What type of entire place are you listing?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entirePlaceTypes.map((type, index) => (
            <button
              key={index}
              onClick={() => {
                setPropertyFlow((prev: any) => ({ ...prev, subCategory: type.id }));
                setGuestHouseType(null);
                setStep(5);
              }}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">{type.title}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const privateRoomTypes = [
      { id: "guest_house", title: "Guest House", description: "Private accommodation in a residential property" },
      { id: "bnb", title: "Bed and Breakfast", description: "Private room with breakfast included" },
      { id: "homestay", title: "Homestay", description: "Stay with a local family" },
      { id: "country_house", title: "Country House", description: "Rural or countryside accommodation" },
      { id: "aparthotel", title: "Aparthotel", description: "Hotel-style room with kitchen facilities" },
      { id: "farmstay", title: "Farm Stay", description: "Accommodation on a working farm" },
      { id: "lodge", title: "Lodge", description: "Rustic accommodation in natural settings" },
    ];

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Private Room Categories</h2>
          <p className="text-lg text-gray-600">What type of private room accommodation?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privateRoomTypes.map((type, index) => (
            <button
              key={index}
              onClick={() => {
                setPropertyFlow((prev: any) => ({ ...prev, subCategory: type.id }));
                setGuestHouseType(null);
                setStep(5);
              }}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">{type.title}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Property Quantity Selection (works for both Entire Place and Private Room)
  if (step === 5) {
    const subCategory = getSubCategoryName();
    const isPrivateRoom = propertyFlow.roomType === "private_room";

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            How many {subCategory.plural} are you listing?
          </h2>
        </div>

        {/* Single Property Option */}
        <button
          onClick={() => setGuestHouseType('single')}
          className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
            guestHouseType === 'single'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-300"
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-left flex-grow">
            <div className="font-medium text-gray-900">
              One {subCategory.singular}{isPrivateRoom && " with one or multiple rooms that guests can book"}
            </div>
          </div>
          {guestHouseType === 'single' && (
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </button>

        {/* Multiple Properties Option */}
        <button
          onClick={() => setGuestHouseType('multiple')}
          className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
            guestHouseType === 'multiple'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-300"
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center relative">
              <Home className="h-6 w-6 text-blue-600 absolute left-2 top-2" />
              <Home className="h-6 w-6 text-blue-600 absolute right-2 bottom-2" />
            </div>
          </div>
          <div className="text-left flex-grow">
            <div className="font-medium text-gray-900">
              Multiple {subCategory.plural}{isPrivateRoom && " with one or multiple rooms that guests can book"}
            </div>
          </div>
          {guestHouseType === 'multiple' && (
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </button>

        {/* Number of Properties Input - Only show if multiple is selected */}
        {guestHouseType === 'multiple' && (
          <div className="mt-10">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Number of properties
            </label>
            <input
              type="number"
              min="2"
              value={propertyCount}
              onChange={(e) => setPropertyCount(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-40 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-8">
          <button
            onClick={() => setStep(propertyFlow.roomType === "entire_place" ? 2 : 3)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (guestHouseType === 'single') {
                setPropertyFlow((prev: any) => ({ 
                  ...prev, 
                  isMultiple: false, 
                  numberOfProperties: 1,
                  guestHouseType: 'single'
                }));
                onNext();
              } else if (guestHouseType === 'multiple') {
                setPropertyFlow((prev: any) => ({ 
                  ...prev, 
                  isMultiple: true, 
                  numberOfProperties: propertyCount,
                  guestHouseType: 'multiple'
                }));
                onNext();
              }
            }}
            disabled={guestHouseType === null}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              guestHouseType === null
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
};

// Hotels Flow Step
const HotelsFlowStep: React.FC<{
  propertyFlow: any;
  setPropertyFlow: any;
  onNext: () => void;
  onBack: () => void;
}> = ({ propertyFlow, setPropertyFlow, onNext, onBack }) => {
  const [step, setStep] = useState(1);
  const [propertyCount, setPropertyCount] = useState(2);
  const [selectedType, setSelectedType] = useState<'single' | 'multiple' | null>(null);

  // Helper function to get subcategory display name
  const getSubCategoryName = () => {
    const allTypes = [
      { id: "hotel", title: "Hotel", singular: "hotel", plural: "hotels" },
      { id: "guest_house", title: "Guest house", singular: "guest house", plural: "guest houses" },
      { id: "bed_and_breakfast", title: "Bed and breakfast", singular: "bed and breakfast", plural: "bed and breakfasts" },
      { id: "homestay", title: "Homestay", singular: "homestay", plural: "homestays" },
      { id: "hostel", title: "Hostel", singular: "hostel", plural: "hostels" },
      { id: "aparthotel", title: "Aparthotel", singular: "aparthotel", plural: "aparthotels" },
      { id: "capsule_hotel", title: "Capsule hotel", singular: "capsule hotel", plural: "capsule hotels" },
      { id: "country_house", title: "Country house", singular: "country house", plural: "country houses" },
      { id: "farm_stay", title: "Farm stay", singular: "farm stay", plural: "farm stays" },
      { id: "inn", title: "Inn", singular: "inn", plural: "inns" },
      { id: "love_hotel", title: "Love hotel", singular: "love hotel", plural: "love hotels" },
      { id: "motel", title: "Motel", singular: "motel", plural: "motels" },
      { id: "resort", title: "Resort", singular: "resort", plural: "resorts" },
      { id: "riad", title: "Riad", singular: "riad", plural: "riads" },
      { id: "ryokan", title: "Ryokan", singular: "ryokan", plural: "ryokans" },
      { id: "lodge", title: "Lodge", singular: "lodge", plural: "lodges" },
    ];
    
    const selected = allTypes.find(type => type.id === propertyFlow.subCategory);
    return selected || { id: 'property', title: 'Property', singular: 'property', plural: 'properties' };
  };

  if (step === 1) {
    const hotelCategories = [
      { 
        id: "hotel", 
        title: "Hotel", 
        description: "Accommodation for travellers often offering restaurants, meeting rooms and other guest services" 
      },
      { 
        id: "guest_house", 
        title: "Guest house", 
        description: "Private home with separate living facilities for host and guest" 
      },
      { 
        id: "bed_and_breakfast", 
        title: "Bed and breakfast", 
        description: "Private home offering overnight stays and breakfast" 
      },
      { 
        id: "homestay", 
        title: "Homestay", 
        description: "Private home with shared living facilities for host and guest" 
      },
      { 
        id: "hostel", 
        title: "Hostel", 
        description: "Budget accommodation with mostly dorm-style bedding and a social atmosphere" 
      },
      { 
        id: "aparthotel", 
        title: "Aparthotel", 
        description: "A self-catering apartment with some hotel facilities like a reception desk" 
      },
      { 
        id: "capsule_hotel", 
        title: "Capsule hotel", 
        description: "Extremely small units or capsules offering cheap and basic overnight accommodation" 
      },
      { 
        id: "country_house", 
        title: "Country house", 
        description: "Private home with simple accommodation in the countryside" 
      },
      { 
        id: "farm_stay", 
        title: "Farm stay", 
        description: "Private farm with simple accommodation" 
      },
      { 
        id: "inn", 
        title: "Inn", 
        description: "Small and basic accommodation with a rustic feel" 
      },
      { 
        id: "love_hotel", 
        title: "Love hotel", 
        description: "Adult-only accommodation rented per hour or night" 
      },
      { 
        id: "motel", 
        title: "Motel", 
        description: "Roadside hotel, usually for motorists, with direct access to parking and little to no amenities" 
      },
      { 
        id: "resort", 
        title: "Resort", 
        description: "A place for relaxation with onsite restaurants, activities and often with a luxury feel" 
      },
      { 
        id: "riad", 
        title: "Riad", 
        description: "Traditional Moroccan accommodation with a courtyard and luxury feel" 
      },
      { 
        id: "ryokan", 
        title: "Ryokan", 
        description: "Traditional Japanese-style accommodation with meal options" 
      },
      { 
        id: "lodge", 
        title: "Lodge", 
        description: "Private home with accommodation surrounded by nature, such as mountains or forest" 
      },
    ];

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl mb-4">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Hotels & B&Bs</h2>
          <p className="text-lg text-gray-600">From the list below, which property category is most similar to your place?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {hotelCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                setPropertyFlow((prev: any) => ({ ...prev, subCategory: category.id }));
                setSelectedType(null);
                setStep(2);
              }}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Property Quantity Selection
  if (step === 2) {
    const subCategory = getSubCategoryName();

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            How many {subCategory.plural} are you listing?
          </h2>
        </div>

        {/* Single Property Option */}
        <button
          onClick={() => setSelectedType('single')}
          className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
            selectedType === 'single'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-300"
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-left flex-grow">
            <div className="font-medium text-gray-900">
              One {subCategory.singular} with one or multiple rooms that guests can book
            </div>
          </div>
          {selectedType === 'single' && (
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </button>

        {/* Multiple Properties Option */}
        <button
          onClick={() => setSelectedType('multiple')}
          className={`w-full p-5 rounded-lg border-2 transition-all flex items-center gap-4 ${
            selectedType === 'multiple'
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-300"
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center relative">
              <Hotel className="h-6 w-6 text-blue-600 absolute left-2 top-2" />
              <Hotel className="h-6 w-6 text-blue-600 absolute right-2 bottom-2" />
            </div>
          </div>
          <div className="text-left flex-grow">
            <div className="font-medium text-gray-900">
              Multiple {subCategory.plural} with one or multiple rooms that guests can book
            </div>
          </div>
          {selectedType === 'multiple' && (
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          )}
        </button>

        {/* Number of Properties Input - Only show if multiple is selected */}
        {selectedType === 'multiple' && (
          <div className="mt-10">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Number of properties
            </label>
            <input
              type="number"
              min="2"
              value={propertyCount}
              onChange={(e) => setPropertyCount(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-40 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-8">
          <button
            onClick={() => setStep(1)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (selectedType === 'single') {
                setPropertyFlow((prev: any) => ({ 
                  ...prev, 
                  isMultiple: false, 
                  numberOfProperties: 1,
                  selectedType: 'single'
                }));
                onNext();
              } else if (selectedType === 'multiple') {
                setPropertyFlow((prev: any) => ({ 
                  ...prev, 
                  isMultiple: true, 
                  numberOfProperties: propertyCount,
                  selectedType: 'multiple'
                }));
                onNext();
              }
            }}
            disabled={selectedType === null}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedType === null
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
};

// Alternative Places Flow Step
const AlternativeFlowStep: React.FC<{
  propertyFlow: any;
  setPropertyFlow: any;
  onNext: () => void;
  onBack: () => void;
}> = ({ propertyFlow, setPropertyFlow, onNext, onBack }) => {
  const [step, setStep] = useState(1);

    const [sameAddress, setSameAddress] = useState(true);
    const [numberOfProperties, setNumberOfProperties] = useState(2);

  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl mb-4">
            <Tent className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Alternative Places</h2>
          <p className="text-lg text-gray-600">What can guests book?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => {
              setPropertyFlow(prev => ({ ...prev, roomType: 'entire_place' }));
              setStep(2);
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-orange-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Entire Place</h3>
              <p className="text-gray-600">Guests have exclusive access</p>
            </div>
          </button>

          <button
            onClick={() => {
              setPropertyFlow(prev => ({ ...prev, roomType: 'private_room' }));
              setStep(2);
            }}
            className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <Bed className="h-12 w-12 mx-auto mb-4 text-gray-600 group-hover:text-orange-600 group-hover:scale-110 transition-all" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Private Room</h3>
              <p className="text-gray-600">Private space within shared area</p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to categories
          </button>
        </div>
      </div>
    );
  }

 if (step === 2) {
    const alternativeTypes = [
      { 
        id: 'campsite', 
        title: 'Campsite', 
        description: 'Cabins/bungalows + camping/caravan areas',
        icon: Tent
      },
      { 
        id: 'boat', 
        title: 'Boat', 
        description: 'Commercial travel accommodation on a boat',
        icon: Ship
      },
      { 
        id: 'luxury_tent', 
        title: 'Luxury Tent', 
        description: 'Fixed bedding + services, in natural surroundings',
        icon: Mountain
      }
    ];

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Alternative Categories</h2>
          <p className="text-lg text-gray-600">What type of alternative accommodation?</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          {alternativeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setPropertyFlow(prev => ({ ...prev, subCategory: type.id, selectedType: type.title }));
                setStep(3);
              }}
              className="group p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <type.icon className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{type.title}</h3>
                  <p className="text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

 if (step === 3) {
    const isCampsite = propertyFlow.subCategory === 'campsite';
    const isBoat = propertyFlow.subCategory === 'boat';
    const isLuxuryTent = propertyFlow.subCategory === 'luxury_tent';
    
    let singleLabel = 'One';
    let multipleLabel = 'Multiple';
    let questionText = 'How many are you listing?';
    
    if (isCampsite) {
      singleLabel = 'One campsite';
      multipleLabel = 'Multiple campsites';
      questionText = 'How many campsites are you listing?';
    } else if (isBoat) {
      singleLabel = 'One boat';
      multipleLabel = 'Multiple boats';
      questionText = 'How many boats are you listing?';
    } else if (isLuxuryTent) {
      singleLabel = 'One luxury tent';
      multipleLabel = 'Multiple luxury tents';
      questionText = 'How many luxury tents are you listing?';
    }
    
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{questionText}</h2>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
            <button
              onClick={() => {
                setPropertyFlow(prev => ({ ...prev, isMultiple: false, numberOfProperties: 1 }));
                onNext();
              }}
              className="group relative w-full p-6 bg-white border-2 border-blue-500 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-4 rounded">
                  <Home className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{singleLabel}</h3>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setPropertyFlow(prev => ({ ...prev, isMultiple: true, numberOfProperties: 2 }));
                setStep(4);
              }}
              className="group w-full p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-4 rounded group-hover:bg-blue-100 transition-colors">
                  <div className="flex items-center space-x-1">
                    <Home className="h-8 w-8 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <Home className="h-8 w-8 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900">{multipleLabel}</h3>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => setStep(2)} className="text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 4) {
  
    
    const isCampsite = propertyFlow.subCategory === 'campsite';
    const isBoat = propertyFlow.subCategory === 'boat';
    const isLuxuryTent = propertyFlow.subCategory === 'luxury_tent';
    
    let propertyTypePlural = 'properties';
    if (isCampsite) propertyTypePlural = 'campsites';
    else if (isBoat) propertyTypePlural = 'boats';
    else if (isLuxuryTent) propertyTypePlural = 'luxury tents';
    
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Are these {propertyTypePlural} in the same address or building?
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <button
            onClick={() => setSameAddress(true)}
            className={`w-full p-6 bg-white border-2 rounded-lg hover:shadow-lg transition-all duration-300 ${
              sameAddress ? 'border-blue-500' : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded ${sameAddress ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <MapPin className={`h-10 w-10 ${sameAddress ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Yes, these {propertyTypePlural} are at the same address or building
                </h3>
              </div>
              {sameAddress && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => setSameAddress(false)}
            className={`w-full p-6 bg-white border-2 rounded-lg hover:shadow-lg transition-all duration-300 ${
              !sameAddress ? 'border-blue-500' : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-4 rounded ${!sameAddress ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <div className="flex items-center space-x-1">
                  <MapPin className={`h-8 w-8 ${!sameAddress ? 'text-blue-600' : 'text-gray-600'}`} />
                  <MapPin className={`h-8 w-8 ${!sameAddress ? 'text-blue-600' : 'text-gray-600'}`} />
                </div>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  No, these {propertyTypePlural} are at different addresses or buildings
                </h3>
              </div>
              {!sameAddress && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Number of properties
          </label>
          <input
            type="number"
            min="2"
            value={numberOfProperties}
            onChange={(e) => setNumberOfProperties(parseInt(e.target.value) || 2)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>

     <div className="flex justify-between items-center w-full px-10 mt-8">
  {/* Back button - extreme left */}
  <button 
    onClick={() => setStep(3)} 
    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
  >
     Back
  </button>

  {/* Continue button - extreme right */}
  <button
    onClick={() => {
      setPropertyFlow(prev => ({ 
        ...prev, 
        sameAddress,
        numberOfProperties 
      }));
      onNext();
    }}
    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
  >
    Continue 
  </button>
</div>


      </div>
    );
  }
}
;

// Basic Info Step (unchanged from original)
const BasicInfoStep: React.FC<any> = ({ formData, setFormData, onNext, onBack }) => {
  const [attractionInput, setAttractionInput] = useState('');
  
  const isValid = !!(
    formData.name && 
    formData.location && 
    formData.address && 
    formData.post_code && 
    formData.description
  );

const addAttraction = () => {
  const trimmed = attractionInput.trim();
  if (!trimmed) return;

  setFormData(prev => ({
    ...prev,
    nearbyAttractions: prev.nearbyAttractions?.includes(trimmed)
      ? prev.nearbyAttractions
      : [...(prev.nearbyAttractions ?? []), trimmed],
  }));

  setAttractionInput('');
};

const removeAttraction = (index: number) => {
  setFormData(prev => ({
    ...prev,
    nearbyAttractions: (prev.nearbyAttractions ?? []).filter((_, i) => i !== index),
  }));
};


  const handleAttractionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAttraction();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your property</h2>
        <p className="text-gray-600">Provide basic information that guests will see</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Name *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a catchy name for your property"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="City, State"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Post Code / Zip Code *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter post code"
            value={formData.post_code}
            onChange={(e) => setFormData({ ...formData, post_code: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Complete address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your property, its unique features, and what makes it special..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* NEW: Nearby Attractions Field */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nearby Attractions
            <span className="text-gray-500 text-xs ml-2">(Optional)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Taj Mahal, Marina Beach, Gateway of India"
              value={attractionInput}
              onChange={(e) => setAttractionInput(e.target.value)}
              onKeyPress={handleAttractionKeyPress}
            />
            <button
              type="button"
              onClick={addAttraction}
              disabled={!attractionInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          
          {formData.nearbyAttractions && formData.nearbyAttractions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.nearbyAttractions.map((attraction, index) => (
                <div
                  key={index}
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm flex items-center gap-2 border border-blue-200"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{attraction}</span>
                  <button
                    type="button"
                    onClick={() => removeAttraction(index)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Add popular tourist spots, landmarks, or points of interest near your property
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Details Step (unchanged from original)

// Move useLimits OUTSIDE the component
// Move useLimits OUTSIDE the component
const useLimits = () => {
  const [limits, setLimits] = useState<PropertyLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      const result = await propertyLimitsService.getPropertyLimits();
      if (result.success && result.limits) {
        setLimits(result.limits);
      }
      setLoading(false);
    };
    fetchLimits();
  }, []);

  return { limits, loading };
};

// Bed type configurations matching the schema
const BED_TYPES = [
  { type: 'Single bed', size: '90–130 cm wide', icon: '🛏️', value: 'single' },
  { type: 'Double bed', size: '131–150 cm wide', icon: '🛏️', value: 'double' },
  { type: 'Large bed (King size)', size: '151–180 cm wide', icon: '🛏️', value: 'queen' },
  { type: 'Extra-large double bed (Super-king size)', size: '181–210 cm wide', icon: '🛏️', value: 'king' },
  { type: 'Bunk bed', size: 'Variable size', icon: '🪜', value: 'bunk' },
  { type: 'Sofa bed', size: 'Variable size', icon: '🛋️', value: 'sofa_bed' },
  { type: 'Futon Mat', size: 'Variable size', icon: '🛏️', value: 'futon' }
];

const DetailsStep: React.FC<any> = ({ formData, setFormData, onNext, onBack }) => {
  const { limits, loading: limitsLoading } = useLimits();
  
  // Initialize bed configuration with NEW SCHEMA structure
  const [bedConfig, setBedConfig] = useState(() => {
    // Check if we have valid bed_configuration data
    if (formData.bed_configuration && 
        typeof formData.bed_configuration === 'object' &&
        formData.bed_configuration.bedrooms &&
        Array.isArray(formData.bed_configuration.bedrooms) &&
        formData.bed_configuration.bedrooms.length > 0) {
      return formData.bed_configuration;
    }
    
    // Initialize with default structure matching schema
    return {
      bedrooms: [{
        name: "Bedroom 1",
        beds: BED_TYPES.map(bt => ({
          type: bt.type,
          size: bt.size,
          count: 0
        }))
      }],
      living_room: {
        beds: [{
          type: "Sofa bed",
          size: "Variable size",
          count: 0
        }]
      },
      other_spaces: [{
        name: "Other Space 1",
        beds: BED_TYPES.map(bt => ({
          type: bt.type,
          size: bt.size,
          count: 0
        }))
      }]
    };
  });

  const [allowChildren, setAllowChildren] = useState<boolean>(() => formData.allowChildren !== undefined ? formData.allowChildren : true);
  const [offerCots, setOfferCots] = useState<boolean>(() => formData.offerCots !== undefined ? formData.offerCots : true);
  const [editingBedroomIndex, setEditingBedroomIndex] = useState<number | null>(null);
  const [livingRoomExpanded, setLivingRoomExpanded] = useState(false);
  const [otherSpacesExpanded, setOtherSpacesExpanded] = useState(false);

  // Use limits with fallback values
  const maxBedrooms = limits?.max_bedrooms ?? 25;
  const maxBedsPerRoom = limits?.max_total_beds_per_room ?? 25;
  const maxGuests = limits?.max_guests ?? 100;
  const maxBathrooms = limits?.max_bathrooms ?? 100;

  // Calculate total beds in bedrooms only
  const getTotalBedsInBedrooms = () => {
    let total = 0;
    
    // Count bedroom beds only
    if (bedConfig.bedrooms) {
      bedConfig.bedrooms.forEach(bedroom => {
        bedroom.beds?.forEach(bed => total += (bed.count || 0));
      });
    }
    
    return total;
  };

  // Update formData whenever bedConfig changes
  useEffect(() => {
    // Safety check
    if (!bedConfig || !bedConfig.bedrooms || !Array.isArray(bedConfig.bedrooms)) {
      return;
    }

    // Calculate total bedrooms count (only count bedrooms with at least 1 bed)
    const bedroomsWithBeds = bedConfig.bedrooms.filter(bedroom => {
      const totalBeds = bedroom.beds?.reduce((sum, bed) => sum + (bed.count || 0), 0) || 0;
      return totalBeds > 0;
    }).length;

    setFormData(prev => ({
      ...prev,
      bed_configuration: bedConfig,
      bedrooms: Math.max(1, bedroomsWithBeds) // At least 1 bedroom required
    }));
  }, [bedConfig]);

  // BEDROOM FUNCTIONS
  const addBedroom = () => {
    if (!bedConfig.bedrooms || bedConfig.bedrooms.length >= maxBedrooms) return;
    
    setBedConfig(prev => ({
      ...prev,
      bedrooms: [...(prev.bedrooms || []), {
        name: `Bedroom ${(prev.bedrooms?.length || 0) + 1}`,
        beds: BED_TYPES.map(bt => ({
          type: bt.type,
          size: bt.size,
          count: 0
        }))
      }]
    }));
    setEditingBedroomIndex((bedConfig.bedrooms?.length || 0));
  };

  const removeBedroom = (index: number) => {
    if (!bedConfig.bedrooms || bedConfig.bedrooms.length <= 1) return; // Keep at least one bedroom
    
    setBedConfig(prev => ({
      ...prev,
      bedrooms: (prev.bedrooms || []).filter((_, i) => i !== index).map((br, i) => ({
        ...br,
        name: `Bedroom ${i + 1}`
      }))
    }));
    if (editingBedroomIndex === index) {
      setEditingBedroomIndex(null);
    }
  };

  const getTotalBedsInBedroom = (bedroomIndex: number) => {
    if (!bedConfig.bedrooms || !bedConfig.bedrooms[bedroomIndex]) return 0;
    return bedConfig.bedrooms[bedroomIndex]?.beds?.reduce((sum, bed) => sum + (bed.count || 0), 0) || 0;
  };

  const updateBedroomBedCount = (bedroomIndex: number, bedIndex: number, newCount: number) => {
    if (!bedConfig.bedrooms || !bedConfig.bedrooms[bedroomIndex]) return;
    
    const currentTotal = getTotalBedsInBedroom(bedroomIndex);
    const currentBedCount = bedConfig.bedrooms[bedroomIndex].beds[bedIndex]?.count || 0;
    
    // Check if adding would exceed max
    if (newCount > currentBedCount && currentTotal >= maxBedsPerRoom) {
      return;
    }
    
    setBedConfig(prev => {
      const newBedrooms = [...(prev.bedrooms || [])];
      if (!newBedrooms[bedroomIndex]) return prev;
      
      const beds = [...(newBedrooms[bedroomIndex].beds || [])];
      if (!beds[bedIndex]) return prev;
      
      beds[bedIndex] = { ...beds[bedIndex], count: Math.max(0, newCount) };
      newBedrooms[bedroomIndex] = { ...newBedrooms[bedroomIndex], beds };
      return { ...prev, bedrooms: newBedrooms };
    });
  };

  // LIVING ROOM FUNCTIONS
  const getTotalLivingRoomBeds = () => {
    if (!bedConfig.living_room || !bedConfig.living_room.beds) return 0;
    return bedConfig.living_room.beds?.reduce((sum, bed) => sum + (bed.count || 0), 0) || 0;
  };

  const updateLivingRoomBedCount = (bedIndex: number, newCount: number) => {
    if (!bedConfig.living_room || !bedConfig.living_room.beds) return;
    
    const currentTotal = getTotalLivingRoomBeds();
    const currentBedCount = bedConfig.living_room.beds[bedIndex]?.count || 0;
    
    if (newCount > currentBedCount && currentTotal >= maxBedsPerRoom) {
      return;
    }
    
    setBedConfig(prev => ({
      ...prev,
      living_room: {
        beds: (prev.living_room?.beds || []).map((bed, i) => 
          i === bedIndex ? { ...bed, count: Math.max(0, newCount) } : bed
        )
      }
    }));
  };

  // OTHER SPACES FUNCTIONS
  const getTotalBedsInOtherSpace = (spaceIndex: number) => {
    if (!bedConfig.other_spaces || !bedConfig.other_spaces[spaceIndex]) return 0;
    return bedConfig.other_spaces[spaceIndex]?.beds?.reduce((sum, bed) => sum + (bed.count || 0), 0) || 0;
  };

  const getTotalOtherSpacesBeds = () => {
    if (!bedConfig.other_spaces) return 0;
    let total = 0;
    bedConfig.other_spaces?.forEach(space => {
      space.beds?.forEach(bed => total += (bed.count || 0));
    });
    return total;
  };

  const getOtherSpacesSummary = () => {
    const totalBeds = getTotalOtherSpacesBeds();
    if (totalBeds === 0) return '0 beds';
    
    const bedCounts: { [key: string]: number } = {};
    bedConfig.other_spaces?.forEach(space => {
      space.beds?.forEach(bed => {
        if (bed.count > 0) {
          bedCounts[bed.type] = (bedCounts[bed.type] || 0) + bed.count;
        }
      });
    });

    const summary = Object.entries(bedCounts)
      .map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? 's' : ''}`)
      .join(', ');

    return summary || `${totalBeds} beds`;
  };

  const addOtherSpace = () => {
    setBedConfig(prev => ({
      ...prev,
      other_spaces: [...(prev.other_spaces || []), {
        name: `Other Space ${(prev.other_spaces?.length || 0) + 1}`,
        beds: BED_TYPES.map(bt => ({
          type: bt.type,
          size: bt.size,
          count: 0
        }))
      }]
    }));
  };

  const removeOtherSpace = (spaceIndex: number) => {
    setBedConfig(prev => ({
      ...prev,
      other_spaces: prev.other_spaces.filter((_, i) => i !== spaceIndex).map((space, i) => ({
        ...space,
        name: `Other Space ${i + 1}`
      }))
    }));
  };

  const updateOtherSpaceBedCount = (spaceIndex: number, bedIndex: number, newCount: number) => {
    if (!bedConfig.other_spaces || !bedConfig.other_spaces[spaceIndex]) return;
    
    const currentTotal = getTotalBedsInOtherSpace(spaceIndex);
    const currentBedCount = bedConfig.other_spaces[spaceIndex].beds[bedIndex]?.count || 0;
    
    if (newCount > currentBedCount && currentTotal >= maxBedsPerRoom) {
      return;
    }
    
    setBedConfig(prev => {
      const newSpaces = [...(prev.other_spaces || [])];
      if (!newSpaces[spaceIndex]) return prev;
      
      const beds = [...(newSpaces[spaceIndex].beds || [])];
      if (!beds[bedIndex]) return prev;
      
      beds[bedIndex] = { ...beds[bedIndex], count: Math.max(0, newCount) };
      newSpaces[spaceIndex] = { ...newSpaces[spaceIndex], beds };
      return { ...prev, other_spaces: newSpaces };
    });
  };

  // Updated validation - require at least 1 bed in bedrooms only
  const totalBedroomBeds = getTotalBedsInBedrooms();
  const totalBeds = totalBedroomBeds; // For validation warning
  const isValid = !!(formData.maxGuests >= 1 && formData.bathrooms >= 1 && totalBedroomBeds >= 1);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h2>
        <p className="text-gray-600">Where can people sleep?</p>
      </div>

      {limitsLoading && <p className="text-sm text-gray-500">Loading limits...</p>}

      {/* Validation Warning */}
      

      {/* BEDROOMS SECTION */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3">Bedrooms</h3>
        
        <button
          onClick={addBedroom}
          disabled={!bedConfig.bedrooms || bedConfig.bedrooms.length >= maxBedrooms}
          className={`w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 mb-3 ${
            !bedConfig.bedrooms || bedConfig.bedrooms.length >= maxBedrooms 
              ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'border-blue-600 text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">
            Add bedroom {bedConfig.bedrooms && bedConfig.bedrooms.length >= maxBedrooms && '(Max limit reached)'}
          </span>
        </button>

        {bedConfig.bedrooms && bedConfig.bedrooms.map((bedroom, bedroomIndex) => (
          <div key={bedroomIndex} className="border border-gray-300 rounded mb-2">
            {editingBedroomIndex === bedroomIndex ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{bedroom.name}</h3>
                  {bedConfig.bedrooms && bedConfig.bedrooms.length > 1 && (
                    <button
                      onClick={() => {
                        setEditingBedroomIndex(null);
                        removeBedroom(bedroomIndex);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {bedroom.beds?.map((bed, bedIndex) => {
                    const totalBeds = getTotalBedsInBedroom(bedroomIndex);
                    const canAddMore = totalBeds < maxBedsPerRoom;
                    const bedType = BED_TYPES.find(bt => bt.type === bed.type);
                    
                    return (
                      <div key={bedIndex} className="flex items-center justify-between py-2">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{bedType?.icon || '🛏️'}</span>
                          <div>
                            <div className="font-medium">{bed.type}</div>
                            <div className="text-sm text-gray-600">{bed.size}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateBedroomBedCount(bedroomIndex, bedIndex, bed.count - 1)}
                            className="text-gray-600 hover:text-gray-800 text-xl px-2"
                            disabled={bed.count === 0}
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">{bed.count}</span>
                          <button
                            onClick={() => updateBedroomBedCount(bedroomIndex, bedIndex, bed.count + 1)}
                            className={`text-xl px-2 ${canAddMore ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                            disabled={!canAddMore}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setEditingBedroomIndex(null)}
                  className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => setEditingBedroomIndex(bedroomIndex)}
                  className="flex-1 p-3 flex items-center justify-between"
                >
                  <div className="text-left">
                    <div className="font-medium text-blue-600">{bedroom.name}</div>
                    <div className="text-sm text-gray-600">{getTotalBedsInBedroom(bedroomIndex)} beds</div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                </button>
                {bedConfig.bedrooms && bedConfig.bedrooms.length > 1 && (
                  <button
                    onClick={() => removeBedroom(bedroomIndex)}
                    className="p-3 text-blue-600 hover:text-blue-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* LIVING ROOM SECTION */}
        <div className="border border-gray-300 rounded mb-2">
          {livingRoomExpanded ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Living room</h3>
                <button
                  onClick={() => setLivingRoomExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {bedConfig.living_room.beds?.map((bed, bedIndex) => {
                  const totalBeds = getTotalLivingRoomBeds();
                  const canAddMore = totalBeds < maxBedsPerRoom;
                  
                  return (
                    <div key={bedIndex} className="flex items-center justify-between py-2">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🛋️</span>
                        <div>
                          <div className="font-medium">{bed.type}</div>
                          <div className="text-sm text-gray-600">{bed.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-2 py-1">
                        <button
                          onClick={() => updateLivingRoomBedCount(bedIndex, bed.count - 1)}
                          className="text-gray-600 hover:text-gray-800 text-xl px-2"
                          disabled={bed.count === 0}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{bed.count}</span>
                        <button
                          onClick={() => updateLivingRoomBedCount(bedIndex, bed.count + 1)}
                          className={`text-xl px-2 ${canAddMore ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                          disabled={!canAddMore}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setLivingRoomExpanded(false)}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLivingRoomExpanded(true)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-medium text-blue-600">Living room</div>
                <div className="text-sm text-gray-600">{getTotalLivingRoomBeds()} sofa beds</div>
              </div>
              <ChevronDown className="w-5 h-5 text-blue-600" />
            </button>
          )}
        </div>

        {/* OTHER SPACES SECTION */}
        <div className="border border-gray-300 rounded mb-2">
          {otherSpacesExpanded ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Other spaces</h3>
                <button
                  onClick={() => setOtherSpacesExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {bedConfig.other_spaces?.map((space, spaceIndex) => (
                <div key={spaceIndex} className="mb-4 pb-4 border-b last:border-b-0">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">{space.name}</h4>
                    <button
                      onClick={() => removeOtherSpace(spaceIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {space.beds?.map((bed, bedIndex) => {
                      const totalBeds = getTotalBedsInOtherSpace(spaceIndex);
                      const canAddMore = totalBeds < maxBedsPerRoom;
                      const bedType = BED_TYPES.find(bt => bt.type === bed.type);
                      
                      return (
                        <div key={bedIndex} className="flex items-center justify-between py-1">
                          <div className="flex items-start gap-2">
                            <span className="text-xl">{bedType?.icon || '🛏️'}</span>
                            <div>
                              <div className="text-sm font-medium">{bed.type}</div>
                              <div className="text-xs text-gray-500">{bed.size}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
                            <button
                              onClick={() => updateOtherSpaceBedCount(spaceIndex, bedIndex, bed.count - 1)}
                              className="text-gray-600 hover:text-gray-800 text-lg px-1"
                              disabled={bed.count === 0}
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{bed.count}</span>
                            <button
                              onClick={() => updateOtherSpaceBedCount(spaceIndex, bedIndex, bed.count + 1)}
                              className={`text-lg px-1 ${canAddMore ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                              disabled={!canAddMore}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              <button
                onClick={addOtherSpace}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                <Plus className="h-4 w-4" />
                Add Other Space
              </button>

              <button
                onClick={() => setOtherSpacesExpanded(false)}
                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOtherSpacesExpanded(true)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-medium text-blue-600">Other spaces</div>
                <div className="text-sm text-gray-600">{getOtherSpacesSummary()}</div>
              </div>
              <ChevronDown className="w-5 h-5 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* GUEST AND BATHROOM DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Guests *</label>
          <div className="relative flex items-center border border-gray-300 rounded-lg">
            <Users className="absolute left-3 text-gray-400 h-5 w-5" />
            <input
              type="number"
              className="w-full text-center pl-10 pr-10 py-3 outline-none focus:ring-0 focus:border-transparent rounded-lg"
              value={formData.maxGuests}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxGuests: Math.min(maxGuests, Math.max(1, parseInt(e.target.value) || 1)),
                })
              }
              min="1"
              max={maxGuests}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
          <div className="relative flex items-center border border-gray-300 rounded-lg">
            <Bath className="absolute left-3 text-gray-400 h-5 w-5" />
            <input
              type="number"
              className="w-full text-center pl-10 pr-10 py-3 outline-none focus:ring-0 focus:border-transparent rounded-lg"
              value={formData.bathrooms}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  bathrooms: Math.min(maxBathrooms, Math.max(1, parseInt(e.target.value) || 1)),
                })
              }
              min="1"
              max={maxBathrooms}
            />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Size
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-[65%]">
              <Square className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                min="0"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Size"
                value={formData.propertySize}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    propertySize: e.target.value,
                  })
                }
              />
            </div>

            <div className="w-[35%]">
              <select
                className="w-full py-3 px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.sizeUnit || "sqft"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sizeUnit: e.target.value as "sqft" | "sqm",
                  })
                }
              >
                <option value="sqft">Sq. Feet</option>
                <option value="sqm">Sq. Meter</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* CHILDREN POLICY */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-2">Do you allow children?</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAllowChildren(true);
              setFormData({ ...formData, allowChildren: true });
            }}
            className={`px-6 py-2 rounded-full border ${
              allowChildren
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => {
              setAllowChildren(false);
              setFormData({ ...formData, allowChildren: false });
            }}
            className={`px-6 py-2 rounded-full border ${
              !allowChildren
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* COTS POLICY */}
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-1">Do you offer cots?</h3>
        <p className="text-sm text-gray-600 mb-2">
          Cots sleep most infants 0-3 and can be made available to guests on request
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setOfferCots(true);
              setFormData({ ...formData, offerCots: true });
            }}
            className={`px-6 py-2 rounded-full border ${
              offerCots
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => {
              setOfferCots(false);
              setFormData({ ...formData, offerCots: false });
            }}
            className={`px-6 py-2 rounded-full border ${
              !offerCots
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Amenities Step (unchanged from original)
const AmenitiesStep: React.FC<any> = ({ formData, setFormData, onNext, onBack }) => {
  const amenityCategories = {
    general: {
      title: 'General',
      amenities: [
       
        { value: 'Air conditioning', label: 'Air conditioning', icon: Wind },
        { value: 'Heating', label: 'Heating', icon: Sun },
        { value: 'Free WiFi', label: 'Free WiFi', icon: Wifi },
        { value: 'Electric vehicle charging station', label: 'Electric vehicle charging station', icon: Plug2 },
        { value: 'Free Parking', label: 'Free Parking', icon: Car },
        { value: 'Airport Shuttle', label: 'Airport Shuttle', icon: Car },
      ]
    },
    cookingCleaning: {
      title: 'Cooking and cleaning',
      amenities: [
        
        { value: 'Kitchen', label: 'Kitchen', icon: Utensils },
        { value: 'Kitchenette', label: 'Kitchenette', icon: Coffee },
        { value: 'Washing machine', label: 'Washing machine', icon: Wind },
        { value: 'Dishwasher', label: 'Dishwasher', icon: Droplet },
        { value: 'Microwave', label: 'Microwave', icon: Square },
        { value: 'Refrigerator', label: 'Refrigerator', icon: Box },
      ]
    },
    entertainment: {
      title: 'Entertainment',
      amenities: [
        
        { value: 'Flat-screen TV', label: 'Flat-screen TV', icon: Tv },
        { value: 'Swimming pool', label: 'Swimming pool', icon: Waves },
        { value: 'Hot tub', label: 'Hot tub', icon: Droplets },
        { value: 'Minibar', label: 'Minibar', icon: Wine },
        { value: 'Sauna', label: 'Sauna', icon: Sun },
        { value: 'Spa & Wellness', label: 'Spa & Wellness', icon: Sparkles },
        { value: 'Fitness Center', label: 'Fitness Center', icon: Dumbbell },
        { value: 'Game Room', label: 'Game Room', icon: Gamepad2 },
      ]
    },
    outsideView: {
      title: 'Outside and view',
      amenities: [
        
        { value: 'Balcony', label: 'Balcony', icon: Home },
        { value: 'Garden view', label: 'Garden view', icon: Trees },
        { value: 'Terrace', label: 'Terrace', icon: Home },
        { value: 'View', label: 'View', icon: Eye },
        { value: 'Beach Access', label: 'Beach Access', icon: Umbrella },
        { value: 'Mountain View', label: 'Mountain View', icon: Mountain },
      ]
    },
    services: {
      title: 'Services',
      amenities: [
      
        { value: 'Room Service', label: 'Room Service', icon: Utensils },
        { value: '24/7 Concierge', label: '24/7 Concierge', icon: User },
        { value: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed },
        { value: 'Bar/Lounge', label: 'Bar/Lounge', icon: Wine },
        { value: 'Laundry Service', label: 'Laundry Service', icon: Wind },
        { value: 'Housekeeping', label: 'Housekeeping', icon: Sparkles },
      ]
    },
    business: {
      title: 'Business facilities',
      amenities: [
        
        { value: 'Business Center', label: 'Business Center', icon: Building2 },
        { value: 'Conference Rooms', label: 'Conference Rooms', icon: Users },
        { value: 'Printer', label: 'Printer', icon: Printer },
        { value: 'High-speed Internet', label: 'High-speed Internet', icon: Wifi },
        { value: 'NA-business', label: 'Not Available', icon: X }
      ]
    }
  };

  const toggleAmenity = (amenity: string, categoryKey: string) => {
    const currentAmenities = formData.amenities || [];
    const isSelected = currentAmenities.includes(amenity);
    const isNA = amenity.startsWith('NA-');
    
    if (isNA) {
      // If selecting NA, remove all other amenities from this category
      const categoryAmenities = amenityCategories[categoryKey].amenities
        .map(a => a.value)
        .filter(v => !v.startsWith('NA-'));
      
      const filteredAmenities = currentAmenities.filter(a => !categoryAmenities.includes(a));
      
      if (isSelected) {
        // Deselecting NA
        setFormData({
          ...formData,
          amenities: filteredAmenities
        });
      } else {
        // Selecting NA
        setFormData({
          ...formData,
          amenities: [...filteredAmenities, amenity]
        });
      }
    } else {
      // If selecting a regular amenity, remove NA from this category
      const naValue = `NA-${categoryKey}`;
      const filteredAmenities = currentAmenities.filter(a => a !== naValue);
      
      if (isSelected) {
        setFormData({
          ...formData,
          amenities: filteredAmenities.filter(a => a !== amenity)
        });
      } else {
        setFormData({
          ...formData,
          amenities: [...filteredAmenities, amenity]
        });
      }
    }
  };

  const hasAnySelection = formData.amenities && formData.amenities.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What can guests use at your place?</h2>
        <p className="text-gray-600">Select all amenities available at your property</p>
      </div>

      <div className="space-y-8">
        {Object.entries(amenityCategories).map(([key, category]) => (
          <div key={key} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
            <div className="space-y-2">
              {category.amenities.map((amenity) => {
                const isSelected = formData.amenities?.includes(amenity.value);
                const IconComponent = amenity.icon;
                const isNA = amenity.value.startsWith('NA-');
                return (
                  <label
                    key={amenity.value}
                    className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors ${isNA ? 'border-t pt-3 mt-2' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAmenity(amenity.value, key)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">{amenity.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600 pt-4 border-t">
        {formData.amenities?.length || 0} amenities selected
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasAnySelection}
          className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
            hasAnySelection
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Photos Step (unchanged from original)
const PhotosStep: React.FC<any> = ({ 
  uploadedImages, 
  setUploadedImages, 
  uploadingImages, 
  setUploadingImages, 
  uploadImage,
  onNext,
  onBack,
  coverImageIndex,
  setCoverImageIndex
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isValid = uploadedImages.length >= 5;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return null;
      }

      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        return null;
      }

      return await uploadImage(file);
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(url => url !== null) as string[];
      
      setUploadedImages(prev => [...prev, ...successfulUploads]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Some images failed to upload. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
  setUploadedImages(prev => prev.filter((_, i) => i !== index));

  if (coverImageIndex === index) {
    setCoverImageIndex(null);
  } else if (coverImageIndex !== null && index < coverImageIndex) {
    setCoverImageIndex(coverImageIndex - 1);
  } else if (index === 0 && uploadedImages.length > 1) {
    setCoverImageIndex(0); // automatically make new first image as cover
  }
};


 const setCoverImage = (index: number) => {
  setUploadedImages(prev => {
    const newImages = [...prev];
    const [selected] = newImages.splice(index, 1); // remove selected image
    newImages.unshift(selected); // put it at the front
    return newImages;
  });
  setCoverImageIndex(0); // cover image is now always the first
};


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add at least 5 photos of your property</h2>
        <p className="text-gray-600">Upload high-quality photos to attract more guests</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
        
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Property Photos</h3>
        <p className="text-gray-600 mb-4">Drag and drop images here, or click to browse</p>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImages}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploadingImages ? 'Uploading...' : 'Choose Photos'}
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          Maximum 5MB per image. Supported formats: JPG, PNG, WEBP
        </p>
      </div>

      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Photos ({uploadedImages.length}/5 minimum)
          </h3>
          {uploadedImages.length < 5 && (
            <p className="text-amber-600 mb-4 text-sm font-medium">
              ⚠️ Please upload at least {5 - uploadedImages.length} more {5 - uploadedImages.length === 1 ? 'image' : 'images'} to continue
            </p>
          )}
          {coverImageIndex === null && uploadedImages.length > 0 && (
            <p className="text-blue-600 mb-4 text-sm font-medium">
              💡 Click "Set as Cover" on any image to choose your cover photo
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Property ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                {coverImageIndex === index ? (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Cover Photo
                  </div>
                ) : (
                  <button
                    onClick={() => setCoverImage(index)}
                    className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-90"
                  >
                    Set as Cover
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadingImages && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Uploading images...</p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Pricing Step (unchanged from original)
const PricingStep: React.FC<any> = ({ formData, setFormData, onNext, onBack }) => {
  const isValid = formData.pricePerNight >= 100;

  // Initialize default values if not set
  if (formData.freeCancellationDays === undefined) formData.freeCancellationDays = 1;
  if (formData.accidentalBookingProtection === undefined) formData.accidentalBookingProtection = true;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Calendar</h2>
        <p className="text-gray-600">Configure your rates and fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="number"
              required
              min="100"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000"
              value={formData.pricePerNight}
              onChange={(e) => setFormData({ ...formData, pricePerNight: parseInt(e.target.value) })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Base rate in Indian Rupees</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cleaning Fee</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="number"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              value={formData.cleaningFee}
              onChange={(e) => setFormData({ ...formData, cleaningFee: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit</label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="number"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              value={formData.securityDeposit}
              onChange={(e) => setFormData({ ...formData, securityDeposit: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Discount (%)</label>
          <input
            type="number"
            min="0"
            max="50"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            value={formData.weeklyDiscount}
            onChange={(e) => setFormData({ ...formData, weeklyDiscount: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Discount (%)</label>
          <input
            type="number"
            min="0"
            max="50"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            value={formData.monthlyDiscount}
            onChange={(e) => setFormData({ ...formData, monthlyDiscount: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Cancellation Policies Section */}
      <div className="bg-white  p-6 space-y-6 mt-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900">Cancellation policies</h3>

        {/* Free Cancellation Days */}
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-900">
              How many days before their arrival can your guests <span className="font-semibold">cancel their booking for free</span>?
            </p>
            {/* <span className="inline-block bg-green-600 text-white text-xs px-3 py-1 rounded">
              Recommended
            </span> */}
          </div>

          <div className="flex flex-wrap gap-3">
            {[1, 5, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setFormData({ ...formData, freeCancellationDays: days })}
                className={`px-6 py-2 rounded-full border-2 transition-all ${
                  formData.freeCancellationDays === days
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>

          <div className="flex items-start space-x-2 bg-blue-50 p-4 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">
              Guests love flexibility – free cancellation rates are generally the most booked rates on our site. Get your first booking sooner by allowing guests to cancel up to five days before check-in.
            </p>
          </div>
        </div>

        {/* Accidental Booking Protection */}
        {/* <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Protection against accidental bookings</h4>
              <p className="text-sm text-gray-600">
                To avoid you having to spend time handling accidental bookings, we automatically waive cancellation fees for guests that cancel within the first 24 hours of making a booking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accidentalBookingProtection: !formData.accidentalBookingProtection })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
                formData.accidentalBookingProtection ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  formData.accidentalBookingProtection ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div> */}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Policies Step (unchanged from original)
const PoliciesStep: React.FC<any> = ({ formData, setFormData, onNext, onBack }) => {
  // Initialize default values if not set
  if (formData.smokingAllowed === undefined) formData.smokingAllowed = false;
  if (formData.partiesAllowed === undefined) formData.partiesAllowed = false;
  if (formData.petsPolicy === undefined) formData.petsPolicy = 'upon-request';
  if (formData.petCharges === undefined) formData.petCharges = 'free';
  if (formData.checkInFrom === undefined) formData.checkInFrom = '15:00';
  if (formData.checkInUntil === undefined) formData.checkInUntil = '18:00';
  if (formData.checkOutFrom === undefined) formData.checkOutFrom = '08:00';
  if (formData.checkOutUntil === undefined) formData.checkOutUntil = '11:00';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set your policies</h2>
        <p className="text-gray-600">Define check-in times, rules, and cancellation policy</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {/* Smoking Toggle */}
        <div className="flex items-center justify-between p-4">
          <span className="text-gray-900">Smoking allowed</span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, smokingAllowed: !formData.smokingAllowed })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.smokingAllowed ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.smokingAllowed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Parties Toggle */}
        <div className="flex items-center justify-between p-4">
          <span className="text-gray-900">Parties/events allowed</span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, partiesAllowed: !formData.partiesAllowed })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.partiesAllowed ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.partiesAllowed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Pet Policy */}
        <div className="p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Do you allow pets?</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="petsPolicy"
                value="yes"
                checked={formData.petsPolicy === 'yes'}
                onChange={(e) => setFormData({ ...formData, petsPolicy: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Yes</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="petsPolicy"
                value="upon-request"
                checked={formData.petsPolicy === 'upon-request'}
                onChange={(e) => setFormData({ ...formData, petsPolicy: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Upon request</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="petsPolicy"
                value="no"
                checked={formData.petsPolicy === 'no'}
                onChange={(e) => setFormData({ ...formData, petsPolicy: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">No</span>
            </label>
          </div>
        </div>

        {/* Pet Charges */}
        <div className="p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Are there additional charges for pets?</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="petCharges"
                value="free"
                checked={formData.petCharges === 'free'}
                onChange={(e) => setFormData({ ...formData, petCharges: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Pets can stay for free</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="petCharges"
                value="charges-apply"
                checked={formData.petCharges === 'charges-apply'}
                onChange={(e) => setFormData({ ...formData, petCharges: e.target.value })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">Charges may apply</span>
            </label>
          </div>
        </div>

        {/* Check-in Times */}
        <div className="p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Check in</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">From</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.checkInFrom}
                onChange={(e) => setFormData({ ...formData, checkInFrom: e.target.value })}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Until</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.checkInUntil}
                onChange={(e) => setFormData({ ...formData, checkInUntil: e.target.value })}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Check-out Times */}
        <div className="p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Check out</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">From</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.checkOutFrom}
                onChange={(e) => setFormData({ ...formData, checkOutFrom: e.target.value })}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Until</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.checkOutUntil}
                onChange={(e) => setFormData({ ...formData, checkOutUntil: e.target.value })}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Documents Step (unchanged from original)
const DocumentsStep: React.FC<any> = ({ 
  uploadedDocuments, 
  setUploadedDocuments,
  onNext,
  onBack
}) => {
  const requiredDocs = ['aadhar', 'pan', 'property_details', 'bank_details'];
  
  const isValid = requiredDocs.every(type => 
    uploadedDocuments.some(doc => doc.type === type)
  );

  const handleDocumentsUpdate = (newDocuments: any[]) => {
    // Check for duplicates based on document type
    const seenTypes = new Set<string>();
    const seenFiles = new Set<string>();
    
    const uniqueDocuments = newDocuments.filter(doc => {
      // Create a unique identifier for the file (using name and size)
      const fileIdentifier = `${doc.name}_${doc.size}`;
      
      // Check if document type already exists
      if (seenTypes.has(doc.type)) {
        alert(`A ${doc.type.replace(/_/g, ' ')} document has already been uploaded. Please remove the existing one first.`);
        return false;
      }
      
      // Check if the exact same file already exists
      if (seenFiles.has(fileIdentifier)) {
        alert(`This file "${doc.name}" has already been uploaded for another document type.`);
        return false;
      }
      
      seenTypes.add(doc.type);
      seenFiles.add(fileIdentifier);
      return true;
    });

    setUploadedDocuments(uniqueDocuments);
  };

  return (
    <div className="space-y-6">
      <DocumentUpload
        documents={uploadedDocuments}
        onDocumentsUpdate={handleDocumentsUpdate}
        isReadOnly={false}
      />

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Review Step (unchanged from original)
const ReviewStep: React.FC<any> = ({ formData, uploadedImages, onSubmit, isSubmitting, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Listing</h2>
        <p className="text-gray-600">Please review all details before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Preview</h3>
          
          {uploadedImages.length > 0 && (
            <div className="mb-4">
              <img
                src={uploadedImages[0]}
                alt="Property"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              {uploadedImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.slice(1, 5).map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Property ${index + 2}`}
                      className="w-full h-16 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <h4 className="text-xl font-bold text-gray-900 mb-2">{formData.name}</h4>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{formData.location}</span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{formData.maxGuests} guests</span>
            </div>
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{formData.bedrooms} bed{formData.bedrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{formData.bathrooms} bath{formData.bathrooms > 1 ? 's' : ''}</span>
            </div>
          </div>

          <p className="text-gray-700 text-sm mb-4">{formData.description}</p>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">₹{formData.pricePerNight.toLocaleString()}</div>
            <div className="text-sm text-gray-600">per night</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{formData.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{formData.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium">{formData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{formData.maxGuests} guests</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium">₹{formData.pricePerNight.toLocaleString()}/night</span>
              </div>
              {formData.cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning Fee:</span>
                  <span className="font-medium">₹{formData.cleaningFee.toLocaleString()}</span>
                </div>
              )}
              {formData.securityDeposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit:</span>
                  <span className="font-medium">₹{formData.securityDeposit.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{formData.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{formData.contactEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{formData.contactPhone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {formData.amenities?.map((amenity, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-6 border-t">
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Property...</span>
              </div>
            ) : (
              'Submit Property for Review'
            )}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Your property will be reviewed by our team before going live
        </p>
      </div>
    </div>
  );
};

// Success Step (unchanged from original)
const SuccessStep: React.FC<any> = ({ propertyId }) => {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900">Property Submitted Successfully!</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Thank you for listing your property with BharatTrips. Our team will review your submission and get back to you within 24-48 hours.
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>✓ Property review (24-48 hours)</div>
          <div>✓ Document verification</div>
          <div>✓ Quality check</div>
          <div>✓ Go live on platform</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => {
            // *** CLEAR STORAGE AND RELOAD ***
            clearStorage();
            window.location.href = '/list-property';
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          List Another Property
        </button>
        <button
          onClick={() => {
            // *** CLEAR STORAGE BEFORE GOING HOME ***
            clearStorage();
            navigate('/');
          }}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default PropertyListingFlow;