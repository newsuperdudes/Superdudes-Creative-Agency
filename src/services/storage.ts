import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseReader = supabase;


const TABLE_NAME = 'assets';

// Image uploads go to Cloudflare R2 through our Worker. The database record
// still lives in Supabase - only object storage moved off Supabase.
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT;
const UPLOAD_TOKEN = import.meta.env.VITE_UPLOAD_TOKEN;

export const assetStorage = {
  async setItem(key: string, value: string): Promise<void> {
    // If value is a base64 image, upload to Storage first
    let finalValue = value;

    if (value.startsWith('data:image')) {
      try {
        // Compress the image before uploading to reduce size and fix mobile lag
        const { blob, fileName } = await new Promise<{ blob: Blob, fileName: string, fileExt: string }>((resolve, reject) => {
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

        // Upload optimized WebP to Cloudflare R2 via the upload Worker.
        // The Worker holds the R2 binding, so no storage credentials are
        // shipped to the browser; it returns the public r2.dev URL.
        const form = new FormData();
        form.append('file', blob, fileName);
        form.append('key', fileName);

        const res = await fetch(`${UPLOAD_ENDPOINT}/upload`, {
          method: 'POST',
          headers: { 'X-Upload-Token': UPLOAD_TOKEN },
          body: form
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Upload failed (${res.status}): ${detail}`);
        }

        const { url } = await res.json();
        if (!url) throw new Error('Upload succeeded but returned no URL');

        finalValue = url;
      } catch (error) {
        console.error('Error uploading image to R2:', error);
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
