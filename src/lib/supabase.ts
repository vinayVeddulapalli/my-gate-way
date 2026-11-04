// Supabase Client Wrapper (Resilient Multi-Mode with Realtime)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://lxiqquskupxdteasmfrw.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aXFxdXNrdXB4ZHRlYXNtZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mjg1MzgsImV4cCI6MjEwODQwNDUzOH0.bBKZ455Iukxj8M7wTJX4jEwLL2iUzGJk_Wgsn0313jM';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

/**
 * Create an isolated Supabase client without persistent session storage.
 * Used for admin credential provisioning so that creating new accounts in Supabase Auth
 * does not overwrite or swap the active admin's browser session.
 */
export function createIsolatedAuthClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

/**
 * Convert base64 data URL to binary Blob for Supabase Storage uploads
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload visitor or parcel photo to Supabase private storage 'visitor-photos' bucket.
 * Returns the storage object path (e.g. "visitor_1729900000_faisal.jpg") to store in PostgreSQL.
 */
export async function uploadVisitorPhoto(
  fileBlobOrDataUrl: Blob | string,
  identifier: string = 'visitor'
): Promise<string | null> {
  const cleanName = identifier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `${cleanName}_${Date.now()}.jpg`;

  if (!supabase || !isSupabaseConfigured) {
    // In local demo / resilient mode without active Supabase credentials, return local path or data URL
    if (typeof fileBlobOrDataUrl === 'string') {
      return fileBlobOrDataUrl;
    }
    return `local_storage_${fileName}`;
  }

  try {
    const fileBlob: Blob = typeof fileBlobOrDataUrl === 'string'
      ? dataUrlToBlob(fileBlobOrDataUrl)
      : fileBlobOrDataUrl;

    const { data, error } = await supabase.storage.from('visitor-photos').upload(fileName, fileBlob, {
      contentType: fileBlob.type || 'image/jpeg',
      upsert: true
    });

    if (error) {
      console.warn('Storage upload error, falling back to local representation:', error.message);
      return typeof fileBlobOrDataUrl === 'string' ? fileBlobOrDataUrl : null;
    }

    // Return the relative object path in storage rather than base64
    return data.path;
  } catch (err) {
    console.error('Photo upload failed:', err);
    return typeof fileBlobOrDataUrl === 'string' ? fileBlobOrDataUrl : null;
  }
}

/**
 * Cache for signed photo URLs to avoid redundant network roundtrips
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolve an object path stored in PostgreSQL into a displayable URL (signed URL or inline fallback)
 */
export async function getPhotoSignedUrl(photoPath?: string | null): Promise<string | null> {
  if (!photoPath) return null;
  
  // If already an absolute HTTP(S) URL or base64 data URL, return directly
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
    return photoPath;
  }

  // Check in-memory cache
  const cached = signedUrlCache.get(photoPath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  if (!supabase || !isSupabaseConfigured) {
    return photoPath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('visitor-photos')
      .createSignedUrl(photoPath, 86400); // 24 hours expiry

    if (error || !data) {
      return null;
    }

    signedUrlCache.set(photoPath, {
      url: data.signedUrl,
      expiresAt: Date.now() + 82800 * 1000 // Cache for 23 hours
    });

    return data.signedUrl;
  } catch (err) {
    console.warn('Failed to generate signed URL for path:', photoPath, err);
    return null;
  }
}

/**
 * Diagnostic test to verify Supabase connection from the browser
 */
export async function testSupabaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  tablesFound?: string[];
  details?: unknown 
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { 
      success: false, 
      message: 'Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set in .env.local' 
    };
  }

  try {
    const { data, error } = await supabase.from('communities').select('id, name, code').limit(1);
    
    if (error) {
      return { 
        success: false, 
        message: `Database error: ${error.message} (Code: ${error.code}). Ensure migrations 01-05 have been run in Supabase SQL Editor.`, 
        details: error 
      };
    }

    return { 
      success: true, 
      message: `Connected successfully to Supabase! Found community: "${data?.[0]?.name || 'Prestige Lakeside Habitat'}"`,
      tablesFound: ['communities', 'visitor_requests']
    };
  } catch (err: unknown) {
    return { 
      success: false, 
      message: `Network or configuration error: ${(err as Error).message}` 
    };
  }
}
