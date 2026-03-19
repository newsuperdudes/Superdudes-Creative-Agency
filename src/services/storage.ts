import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Anon client for write operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service client for read operations (bypasses RLS to always fetch assets)
const supabaseReader = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

const BUCKET_NAME = 'superdudes';
const TABLE_NAME = 'assets';

export const assetStorage = {
  async setItem(key: string, value: string): Promise<void> {
    // If value is a base64 image, upload to Storage first
    let finalValue = value;

    if (value.startsWith('data:image')) {
      try {
        // Compress the image before uploading to reduce size and fix mobile lag
        const { blob, fileName, fileExt } = await new Promise<{ blob: Blob, fileName: string, fileExt: string }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Output as highly optimized WebP
              canvas.toBlob((b) => {
                if (b) {
                  const ext = 'webp';
                  const name = `${key}_${Date.now()}.${ext}`;
                  resolve({ blob: b, fileName: name, fileExt: ext });
                } else {
                  reject('Canvas conversion failed');
                }
              }, 'image/webp', 0.85);
            } else {
              reject('No canvas context');
            }
          };
          img.onerror = reject;
          img.src = value;
        });

        const filePath = `uploads/${fileName}`;

        // Upload optimized WebP to Supabase Storage
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
      const { data, error } = await supabaseReader
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
    const { data, error } = await supabaseReader
      .from(TABLE_NAME)
      .select('key');

    if (error) {
      console.error('Error fetching keys from Supabase:', error);
      return [];
    }

    return data.map(item => item.key);
  }
};
