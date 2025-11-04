import { supabase } from './supabase';

export interface PropertyLimits {
  id?: number;
  max_bedrooms: number;
  max_guests: number;
  max_bathrooms: number;
  max_property_size: number;
  max_beds_per_type: {
    singleBed: number;
    doubleBed: number;
    largeBed: number;
    extraLargeBed: number;
    bunkBed: number;
    sofaBed: number;
    futonMat: number;
  };
   max_total_beds_per_room: number;
  created_at?: string;
  updated_at?: string;
}

export const propertyLimitsService = {
  /**
   * Get current property limits
   */
  async getPropertyLimits(): Promise<{
    success: boolean;
    limits?: PropertyLimits;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('property_limits')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        limits: data
      };
    } catch (error: any) {
      console.error('Error fetching property limits:', error);
      
      // Return default limits if fetch fails
      return {
        success: true,
        limits: {
          max_bedrooms: 25,
          max_guests: 100,
          max_bathrooms: 100,
          max_property_size: 50000,
          max_beds_per_type: {
            singleBed: 25,
            doubleBed: 25,
            largeBed: 25,
            extraLargeBed: 25,
            bunkBed: 25,
            sofaBed: 25,
            futonMat: 25
          },
          max_total_beds_per_room: 25
        }
      };
    }
  },

  /**
   * Update property limits (admin only)
   */
  async updatePropertyLimits(limits: Partial<PropertyLimits>): Promise<{
    success: boolean;
    limits?: PropertyLimits;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('property_limits')
        .update(limits)
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        limits: data
      };
    } catch (error: any) {
      console.error('Error updating property limits:', error);
      return {
        success: false,
        error: error.message || 'Failed to update property limits'
      };
    }
  }
};