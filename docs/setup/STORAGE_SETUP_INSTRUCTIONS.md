# Supabase Storage Upload Issue - Diagnosis & Solution

## Update: Bucket Exists, But Upload Still Hangs

The `avatars` bucket **exists** in your Supabase Storage (confirmed in Dashboard), but local file uploads still hang at "Uploading...".

### Root Cause

The upload hangs because of **Row Level Security (RLS) policies** on the `storage.objects` table. Even though the bucket exists and is public, the RLS policies may be blocking INSERT operations for authenticated users.

### Evidence

1. ✅ Bucket exists: `avatars` (PUBLIC, 4 policies, has uploaded files)
2. ✅ Code is correct and works with URL paste
3. ❌ Upload via file selection hangs indefinitely
4. The diagnostic script shows: `StorageApiError: new row violates row-level security policy`

## Solution: Fix Storage RLS Policies

Since the bucket already exists, the issue is with the RLS policies. You need to verify and update the policies on `storage.objects`.

### Step 1: Check Existing Policies

1. Go to your Supabase project: https://supabase.com/dashboard/project/geyuwlowtwivtxrpqnwh
2. Click on **Storage** → Click on `avatars` bucket → **Policies** tab
3. Review the existing 4 policies

### Step 2: Verify INSERT Policy (Most Important!)

The INSERT policy is critical for file uploads. It should look like this:

**Expected Policy:**
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

**If this policy is missing or different, you need to:**

1. Delete any existing INSERT policy that might be too restrictive
2. Create a new INSERT policy with the SQL above

**Common Issues:**
- Policy has additional restrictions (e.g., checking file path matches user ID) - this causes uploads to hang
- Policy is missing the `WITH CHECK` clause
- Policy targets wrong role (e.g., `public` instead of `authenticated`)

### Step 3: Quick Fix - Delete Restrictive Policies

If uploads are hanging, the quickest fix is to temporarily simplify the policies:

**Option A: Simple Policy (Recommended for Testing)**

Delete all existing policies and create just these two:

```sql
-- Allow authenticated users to upload ANY file to avatars bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Option B: Keep Existing Policies**

If you want to keep folder-based restrictions for UPDATE/DELETE, at minimum make sure the INSERT policy is simple (as shown above).

### Step 4: Test the Upload

After updating policies:

1. Refresh your app
2. Try uploading a local image
3. The upload should complete within 15 seconds
4. If it times out, check browser console for error messages

### Step 4: Verify Setup

After creating the bucket and policies, run the diagnostic script to verify:

```bash
source ~/.nvm/nvm.sh && node scripts/check-storage.js
```

You should see:
```
✅ "avatars" bucket exists!
   Public: true
🧪 Testing file upload...
✅ Upload test successful!
```

### Step 5: Test in the App

1. Log in to your application
2. Click on your user avatar to open Settings
3. Try uploading a local image file
4. It should now work without hanging!

## Current Code Structure

The upload code in `components/UserSettingsModal.tsx` is already correctly implemented:

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

The code was never the problem - it was just missing the bucket in Supabase.

## Why This Happened

- The `avatars` bucket needs to be created manually in Supabase Dashboard
- RLS policies prevent anonymous users from creating buckets programmatically
- This is a security feature to prevent unauthorized bucket creation

## Quick Fix with SQL Editor

If uploads are hanging, use this SQL script to reset all policies (go to **SQL Editor** in Supabase):

```sql
-- Drop all existing policies on storage.objects for avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create simple policies that allow uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

## Code Changes

I've updated `components/UserSettingsModal.tsx` to add:
- ✅ 15-second timeout for uploads (prevents infinite hanging)
- ✅ Better error messages
- ✅ Specific feedback for timeout and permission errors

Now if upload hangs, users will see: "Upload timeout. Please check Supabase Storage policies or paste image URL instead."

## Summary

**Problem**: Upload hangs due to RLS policy violations on `storage.objects`
**Root Cause**: Existing INSERT policy on `storage.objects` is too restrictive
**Solution**: Simplify the INSERT policy to allow all authenticated users to upload to `avatars` bucket
**Expected Result**: Local image uploads will complete within seconds ✅
