import { supabase } from './supabase';

export interface RegistrationProgress {
  id: string;
  user_id: string;
  step: number;
  form_data: any;
  last_updated: string;
  is_complete: boolean;
  created_at: string;
}

export const registrationService = {
  // Save current progress
  async saveProgress(step: number, formData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from('registration_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .single();

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('registration_progress')
          .update({
            step,
            form_data: formData,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) {
          console.error('Error updating registration progress:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('registration_progress')
          .insert([{
            user_id: user.id,
            step,
            form_data: formData,
            is_complete: false
          }]);

        if (error) {
          console.error('Error saving registration progress:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in saveProgress:', error);
      return { success: false, error: 'Failed to save progress' };
    }
  },

  // Load saved progress
  async loadProgress(): Promise<{ success: boolean; error?: string; progress?: RegistrationProgress }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('registration_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No progress found
          return { success: true, progress: undefined };
        }
        console.error('Error loading registration progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true, progress: data };
    } catch (error) {
      console.error('Error in loadProgress:', error);
      return { success: false, error: 'Failed to load progress' };
    }
  },

  // Check if user has incomplete registration
  async hasIncompleteRegistration(): Promise<{ success: boolean; error?: string; hasIncomplete?: boolean; progress?: RegistrationProgress }> {
    try {
      const result = await this.loadProgress();
      
      if (result.success) {
        return {
          success: true,
          hasIncomplete: !!result.progress,
          progress: result.progress
        };
      }

      return result;
    } catch (error) {
      console.error('Error checking incomplete registration:', error);
      return { success: false, error: 'Failed to check registration status' };
    }
  },

  // Mark registration as complete
  async markComplete(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('registration_progress')
        .update({
          is_complete: true,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_complete', false);

      if (error) {
        console.error('Error marking registration complete:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markComplete:', error);
      return { success: false, error: 'Failed to mark registration complete' };
    }
  },

  // Clear all progress (for starting fresh)
  async clearProgress(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('registration_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('is_complete', false);

      if (error) {
        console.error('Error clearing registration progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in clearProgress:', error);
      return { success: false, error: 'Failed to clear progress' };
    }
  }
};