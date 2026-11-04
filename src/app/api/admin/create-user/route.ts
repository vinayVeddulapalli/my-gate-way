import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://lxiqquskupxdteasmfrw.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aXFxdXNrdXB4ZHRlYXNtZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4Mjg1MzgsImV4cCI6MjEwODQwNDUzOH0.bBKZ455Iukxj8M7wTJX4jEwLL2iUzGJk_Wgsn0313jM';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      full_name, 
      email, 
      password, 
      phone, 
      role, 
      resident_type, 
      flat_id, 
      flat_display,
      community_id,
      custom_flat
    } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const targetCommunityId = community_id || 'a0000000-0000-0000-0000-000000000001';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured in environment.' },
        { status: 500 }
      );
    }

    // Isolated client without session persistence
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // 1. Create or register in Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: {
        data: {
          full_name: full_name.trim(),
          phone: phone ? phone.trim() : '+91 99999 99999',
          role: role,
          resident_type: resident_type || (role === 'resident' ? 'owner' : undefined),
          community_id: targetCommunityId
        }
      }
    });

    if (authError) {
      console.warn('Supabase Auth error in route:', authError.message);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve created user ID from Supabase Auth.' },
        { status: 500 }
      );
    }

    // 2. Upsert into public.user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        community_id: targetCommunityId,
        full_name: full_name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : '+91 99999 99999',
        role: role,
        is_active: true
      });

    if (profileError) {
      console.warn('Supabase user_profiles upsert warning:', profileError.message);
    }

    // 3. If custom_flat provided, ensure flat exists in public.flats
    if (custom_flat && custom_flat.id) {
      try {
        await supabase.from('flats').upsert({
          id: custom_flat.id,
          community_id: targetCommunityId,
          block_id: custom_flat.block_id || 'c0000000-0000-0000-0000-000000000001',
          flat_number: String(custom_flat.flat_number || '101'),
          floor_number: Number(custom_flat.floor_number) || 1,
          intercom_number: String(custom_flat.flat_number || '101'),
          is_occupied: true
        });
      } catch (fErr) {
        console.warn('Supabase custom flat upsert notice:', fErr);
      }
    }

    // 4. If flat_id assigned, link in public.flat_residents
    if (flat_id) {
      const { error: flatError } = await supabase
        .from('flat_residents')
        .upsert({
          flat_id: flat_id,
          user_id: userId,
          is_primary_owner: role === 'resident' && resident_type !== 'tenant',
          is_approved: true
        });

      if (flatError) {
        console.warn('Supabase flat_residents link warning:', flatError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${cleanEmail} created in Supabase Auth and synced to user_profiles!`,
      user: {
        id: userId,
        email: cleanEmail,
        full_name: full_name.trim(),
        phone: phone || '',
        role: role,
        resident_type: resident_type,
        flat_id: flat_id,
        community_id: targetCommunityId
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

