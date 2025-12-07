const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Supabase Storage Upload with Detailed Logging\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    // First, check if user is authenticated
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      console.log('\n⚠️  No authenticated user! This is likely the problem.');
      console.log('The upload code requires an authenticated user.');
      console.log('\nTo fix: Make sure you are logged in when testing the upload in the app.');
      return;
    }

    if (!user) {
      console.log('❌ No user logged in');
      console.log('\n⚠️  You need to be authenticated to upload files.');
      console.log('This is why the upload hangs in the app - the anon key cannot upload.');
      return;
    }

    console.log('✅ User authenticated:', user.id);
    console.log('   Email:', user.email);

    // Try to list buckets (this might fail with RLS)
    console.log('\n2️⃣ Attempting to list buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('⚠️  Cannot list buckets (expected with RLS):', bucketsError.message);
    } else {
      console.log(`✅ Can list buckets: ${buckets.length} found`);
    }

    // Try to upload a test file
    console.log('\n3️⃣ Attempting to upload test file...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${user.id}-${Date.now()}.txt`;

    console.log('   File name:', testFileName);
    console.log('   File size:', testFile.size);
    console.log('   Calling upload...');

    const uploadPromise = supabase.storage
      .from('avatars')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    // Add a timeout to detect hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout after 10 seconds')), 10000)
    );

    const { data: uploadData, error: uploadError } = await Promise.race([
      uploadPromise,
      timeoutPromise
    ]).catch(err => {
      if (err.message === 'Upload timeout after 10 seconds') {
        console.error('❌ UPLOAD HUNG - TIMEOUT after 10 seconds');
        console.log('\n🔍 This confirms the upload is hanging indefinitely.');
        return { data: null, error: err };
      }
      throw err;
    });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);

      if (uploadError.message === 'Upload timeout after 10 seconds') {
        console.log('\n📋 DIAGNOSIS:');
        console.log('The upload call hangs and never completes.');
        console.log('Possible causes:');
        console.log('1. Storage RLS policies blocking authenticated users');
        console.log('2. Network/CORS configuration issue');
        console.log('3. Bucket configuration problem');
        console.log('\n💡 SOLUTION: Check the RLS policies on storage.objects table');
      }
      return;
    }

    console.log('✅ Upload successful!');
    console.log('   Path:', uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(testFileName);
    console.log('   Public URL:', publicUrl);

    // Clean up
    console.log('\n4️⃣ Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([testFileName]);

    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file deleted');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUpload();
