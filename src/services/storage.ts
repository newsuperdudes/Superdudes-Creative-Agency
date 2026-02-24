import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'superdudes';
const TABLE_NAME = 'assets';

export const assetStorage = {
  async setItem(key: string, value: string): Promise<void> {
    // If value is a base64 image, upload to Storage first
    let finalValue = value;

    if (value.startsWith('data:image')) {
      try {
        // Convert base64 to Blob
        const response = await fetch(value);
        const blob = await response.blob();
        const fileExt = value.split(';')[0].split('/')[1];
        const fileName = `${key}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
            upsert: true,
            contentType: `image/${fileExt}`
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);
        
        finalValue = publicUrl;
      } catch (error) {
        console.error('Error uploading image to Supabase Storage:', error);
        throw error;
      }
    }

    // Save/Update in Database
    const { error: dbError } = await supabase
      .from(TABLE_NAME)
      .upsert({ key, value: finalValue }, { onConflict: 'key' });

    if (dbError) {
      console.error('Error saving to Supabase Database:', dbError);
      throw dbError;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data?.value || null;
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Error removing from Supabase:', error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    // This is dangerous, but following the interface
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .neq('key', ''); // Delete all

    if (error) {
      console.error('Error clearing Supabase:', error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('key');

    if (error) {
      console.error('Error fetching keys from Supabase:', error);
      return [];
    }

    return data.map(item => item.key);
  }
};
