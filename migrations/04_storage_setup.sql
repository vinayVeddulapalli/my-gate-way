-- Gateway Security: Apartment Visitor Management System
-- Migration 04: Supabase Private Storage Setup for Visitor Photographs

-- 1. Create Private Storage Bucket for Visitor Photos
-- Note: 'public' is explicitly set to false to enforce private signed URLs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'visitor-photos',
    'visitor-photos',
    false, -- Private bucket
    5242880, -- 5 MB limit per photo
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Security Guard Upload Policy:
-- Guards can upload visitor photos into the visitor-photos bucket
CREATE POLICY "Guards can upload visitor photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'visitor-photos'
        AND (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                  AND user_profiles.role IN ('security_guard', 'community_admin', 'super_admin')
            )
        )
    );

-- 4. Authorized Access Policy for Reading/Downloading:
-- Only Guards, Admins, and the specific flat resident can view/sign photo URLs
CREATE POLICY "Authorized users can read visitor photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'visitor-photos'
        AND (
            -- Admins & Guards can view
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid()
                  AND user_profiles.role IN ('security_guard', 'community_admin', 'super_admin')
            )
            -- Or resident whose flat has a visitor request with this photo
            OR EXISTS (
                SELECT 1 FROM visitor_requests vr
                JOIN flat_residents fr ON fr.flat_id = vr.flat_id
                WHERE fr.user_id = auth.uid()
                  AND vr.visitor_photo_path = storage.objects.name
            )
        )
    );
