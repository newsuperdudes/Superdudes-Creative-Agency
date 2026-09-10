import { requireEditorSession } from './auth';
import { supabase } from './supabaseClient';

export { supabase };

const TABLE_NAME = 'assets';

// Image uploads go to Cloudflare R2 through our Worker. The database record
// still lives in Supabase - only object storage moved off Supabase.
// The Worker is authorised with the caller's own access token; there is no
// shared upload token in the bundle any more.
const UPLOAD_ENDPOINT = import.meta.env.VITE_UPLOAD_ENDPOINT;

export const assetStorage = {
  async setItem(key: string, value: string): Promise<void> {
    // Prove the right to write before touching anything - no upload, no row.
    const session = await requireEditorSession();
    const client = supabase!;

    // If value is a base64 image, upload to Storage first
    let finalValue = value;

    if (value.startsWith('data:image')) {
      if (!UPLOAD_ENDPOINT) {
        throw new Error('Image uploads are not available in this build.');
      }

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
        // shipped to the browser; it re-checks this access token against the
        // database before it writes anything, and returns the public URL.
        const form = new FormData();
        form.append('file', blob, fileName);
        form.append('key', fileName);

        const res = await fetch(`${UPLOAD_ENDPOINT}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: form
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Your session is no longer allowed to upload images. Please sign in again.');
          }
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
    const { error: dbError } = await client
      .from(TABLE_NAME)
      .upsert({ key, value: finalValue }, { onConflict: 'key' });

    if (dbError) {
      console.error('Error saving to Supabase Database:', dbError);
      throw dbError;
    }
  },

  /**
   * Public read. Returns null when the key does not exist; a failed read
   * throws, so callers never mistake "we could not load it" for "it is empty".
   */
  async getItem(key: string): Promise<string | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching from Supabase:', error);
      throw error;
    }

    return data?.value || null;
  },

  async removeItem(key: string): Promise<void> {
    await requireEditorSession();

    const { error } = await supabase!
      .from(TABLE_NAME)
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Error removing from Supabase:', error);
      throw error;
    }
  },

  /**
   * Delete an explicit, caller-listed set of keys.
   *
   * This replaces the old `clear()`, which deleted every row in the table -
   * including presentations owned by the generator. There is no ownership
   * column on `assets`, so the only safe scope is the exact list of keys the
   * caller manages and can name.
   */
  async removeItems(keys: string[]): Promise<void> {
    const unique = [...new Set(keys.filter(Boolean))];
    if (unique.length === 0) return;

    await requireEditorSession();

    const { error } = await supabase!
      .from(TABLE_NAME)
      .delete()
      .in('key', unique);

    if (error) {
      console.error('Error removing assets from Supabase:', error);
      throw error;
    }
  },

  /**
   * Public read. Throws on failure rather than returning an empty list - an
   * empty list looks like "there is nothing here", which invites a caller to
   * recreate and overwrite rows that do exist.
   */
  async getAllKeys(): Promise<string[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('key');

    if (error) {
      console.error('Error fetching keys from Supabase:', error);
      throw error;
    }

    return (data ?? []).map(item => item.key);
  }
};
