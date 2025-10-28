// lib/propertyService.ts - Complete version with all functionality

import { supabase } from './supabase';

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'aadhar' | 'pan' | 'property_details' | 'bank_details' | 'gst' | 'other';
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

export interface PropertyData {
  name: string;
  description: string;
  location: string;
  address: string;
  property_type: 'hotel' | 'resort' | 'homestay' | 'apartment' | 'villa' | 'holiday_home' | 
                 'chalet' | 'guest_house' | 'bnb' | 'country_house' | 'aparthotel' | 
                 'farmstay' | 'lodge' | 'bed_and_breakfast' | 'hostel' | 'capsule_hotel' | 
                 'farm_stay' | 'inn' | 'love_hotel' | 'motel' | 'riad' | 'ryokan' | 
                 'campsite' | 'boat' | 'luxury_tent';
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  property_rules: string[];
  cancellation_policy: string;
  check_in_time: string;
  check_out_time: string;
  minimum_stay: number;
  instant_book: boolean;
  documents: any[];
  
  // Extended fields from updated schema
  main_category?: string;
  sub_category?: string;
  room_type?: 'entire_place' | 'private_room';
  is_multiple?: boolean;
  number_of_properties?: number;
  is_same_location?: boolean;
  property_size?: string;
  size_unit?: 'sqft' | 'sqm';
  bed_configuration?: any;
  allow_children?: boolean;
  offer_cots?: boolean;
  cleaning_fee?: number;
  security_deposit?: number;
  weekly_discount?: number;
  monthly_discount?: number;
  smoking_allowed?: boolean;
  parties_allowed?: boolean;
  pets_policy?: 'yes' | 'upon-request' | 'no';
  pet_charges?: 'free' | 'charges-apply';
  check_in_from?: string;
  check_in_until?: string;
  check_out_from?: string;
  check_out_until?: string;
  free_cancellation_days?: number;
  accidental_booking_protection?: boolean;
  
  // Multiple properties support
  is_multiple_properties?: boolean;
  property_count?: number;
  same_address?: boolean;
  listing_type?: 'single' | 'multiple_same_address' | 'multiple_different_address';
  property_addresses?: any[];
  individual_property_details?: any[];
  bulk_listing_notes?: string;
}

export interface Property extends PropertyData {
  id: string;
  user_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  is_active?: boolean;
  is_available?: boolean;
  user?: {
    name: string;
    email: string;
  };
}

class PropertyService {
  // ==================== DOCUMENT MANAGEMENT ====================
  
  async uploadDocument(
    propertyId: string,
    file: File,
    documentType: 'aadhar' | 'pan' | 'property_details' | 'bank_details' | 'gst' | 'other'
  ): Promise<{ success: boolean; error?: string; filePath?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create file path: userId/propertyId/documentType_timestamp_filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${timestamp}.${fileExt}`;
      const filePath = `${user.id}/${propertyId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Update property with document info
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('documents')
        .eq('id', propertyId)
        .single();

      if (fetchError) {
        console.error('Error fetching property:', fetchError);
        return { success: false, error: fetchError.message };
      }

      const currentDocuments = property.documents || [];
      const newDocument: PropertyDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: documentType,
        file_path: filePath,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      };

      const updatedDocuments = [...currentDocuments, newDocument];

      const { error: updateError } = await supabase
        .from('properties')
        .update({ documents: updatedDocuments })
        .eq('id', propertyId);

      if (updateError) {
        console.error('Error updating property documents:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, filePath };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: 'Failed to upload document' };
    }
  }

  async getDocumentUrl(filePath: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error getting document URL:', error);
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Error getting document URL:', error);
      return { success: false, error: 'Failed to get document URL' };
    }
  }

  async deleteDocument(
    propertyId: string,
    documentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current property documents
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('documents')
        .eq('id', propertyId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      const currentDocuments = property.documents || [];
      const documentToDelete = currentDocuments.find((doc: PropertyDocument) => doc.id === documentId);
      
      if (!documentToDelete) {
        return { success: false, error: 'Document not found' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([documentToDelete.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Update property documents array
      const updatedDocuments = currentDocuments.filter((doc: PropertyDocument) => doc.id !== documentId);

      const { error: updateError } = await supabase
        .from('properties')
        .update({ documents: updatedDocuments })
        .eq('id', propertyId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  // ==================== PROPERTY CRUD OPERATIONS ====================
  
  async createProperty(propertyData: PropertyData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare data for insertion - map all fields from PropertyData to database columns
      const insertData = {
        user_id: user.id,
        name: propertyData.name,
        description: propertyData.description,
        location: propertyData.location,
        address: propertyData.address,
        property_type: propertyData.property_type,
        price_per_night: propertyData.price_per_night,
        max_guests: propertyData.max_guests,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        contact_name: propertyData.contact_name,
        contact_email: propertyData.contact_email,
        contact_phone: propertyData.contact_phone,
        property_rules: propertyData.property_rules || [],
        cancellation_policy: propertyData.cancellation_policy || '',
        check_in_time: propertyData.check_in_time || '15:00',
        check_out_time: propertyData.check_out_time || '11:00',
        minimum_stay: propertyData.minimum_stay || 1,
        instant_book: propertyData.instant_book !== undefined ? propertyData.instant_book : false,
        documents: propertyData.documents || [],
        
        // Extended schema fields
        main_category: propertyData.main_category,
        sub_category: propertyData.sub_category,
        room_type: propertyData.room_type,
        is_multiple: propertyData.is_multiple || propertyData.is_multiple_properties || false,
        number_of_properties: propertyData.number_of_properties || propertyData.property_count || 1,
        is_same_location: propertyData.is_same_location || propertyData.same_address,
        property_size: propertyData.property_size,
        size_unit: propertyData.size_unit || 'sqft',
        bed_configuration: propertyData.bed_configuration,
        allow_children: propertyData.allow_children !== undefined ? propertyData.allow_children : true,
        offer_cots: propertyData.offer_cots !== undefined ? propertyData.offer_cots : true,
        cleaning_fee: propertyData.cleaning_fee || 0,
        security_deposit: propertyData.security_deposit || 0,
        weekly_discount: propertyData.weekly_discount || 0,
        monthly_discount: propertyData.monthly_discount || 0,
        smoking_allowed: propertyData.smoking_allowed || false,
        parties_allowed: propertyData.parties_allowed || false,
        pets_policy: propertyData.pets_policy || 'upon-request',
        pet_charges: propertyData.pet_charges || 'free',
        check_in_from: propertyData.check_in_from || '15:00',
        check_in_until: propertyData.check_in_until || '18:00',
        check_out_from: propertyData.check_out_from || '08:00',
        check_out_until: propertyData.check_out_until || '11:00',
        free_cancellation_days: propertyData.free_cancellation_days || 1,
        accidental_booking_protection: propertyData.accidental_booking_protection !== undefined ? propertyData.accidental_booking_protection : true,
        
        // Multiple properties fields
        listing_type: propertyData.listing_type,
        property_addresses: propertyData.property_addresses,
        individual_property_details: propertyData.individual_property_details,
        bulk_listing_notes: propertyData.bulk_listing_notes,
        
        // Default status fields
        status: 'pending',
        is_active: true,
        is_available: true
      };

      const { data, error } = await supabase
        .from('properties')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating property:', error);
        return { success: false, error: error.message };
      }

      return { success: true, property: data };
    } catch (error) {
      console.error('Error in createProperty:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getProperties(filters?: any) {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true);

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.property_type) {
        query = query.eq('property_type', filters.property_type);
      }

      if (filters?.max_price) {
        query = query.lte('price_per_night', filters.max_price);
      }

      if (filters?.min_guests) {
        query = query.gte('max_guests', filters.min_guests);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        return { success: false, error: error.message };
      }

      return { success: true, properties: data };
    } catch (error) {
      console.error('Error in getProperties:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getPropertyById(id: string) {
    try {
      // First get the property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) {
        console.error('Error fetching property:', propertyError);
        return { success: false, error: propertyError.message };
      }

      // Then get the user profile separately to avoid relationship conflicts
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', propertyData.user_id)
        .single();

      const propertyWithUser = {
        ...propertyData,
        user: profileData
      };

      return { success: true, property: propertyWithUser };
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async updateProperty(id: string, updates: Partial<PropertyData>) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating property:', error);
        return { success: false, error: error.message };
      }

      return { success: true, property: data };
    } catch (error) {
      console.error('Error in updateProperty:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async deleteProperty(id: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting property:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteProperty:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  async getAllProperties(): Promise<{ success: boolean; error?: string; properties?: Property[] }> {
    try {
      // First get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        return { success: false, error: propertiesError.message };
      }

      // Then get user profiles separately to avoid relationship conflicts
      const userIds = [...new Set(propertiesData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      // Combine the data
      const propertiesWithUsers = propertiesData?.map(property => ({
        ...property,
        user: profilesData?.find(profile => profile.id === property.user_id)
      })) || [];

      return { success: true, properties: propertiesWithUsers };
    } catch (error) {
      console.error('Error fetching properties:', error);
      return { success: false, error: 'Failed to fetch properties' };
    }
  }

  async getUserProperties(): Promise<{ success: boolean; error?: string; properties?: Property[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user properties:', error);
        return { success: false, error: error.message };
      }

      return { success: true, properties: data || [] };
    } catch (error) {
      console.error('Error fetching user properties:', error);
      return { success: false, error: 'Failed to fetch properties' };
    }
  }

  async updatePropertyStatus(
    propertyId: string, 
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData: any = {
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId);

      if (error) {
        console.error('Error updating property status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating property status:', error);
      return { success: false, error: 'Failed to update property status' };
    }
  }
}

export const propertyService = new PropertyService();