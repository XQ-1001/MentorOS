const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Authenticated Upload\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthenticatedUpload() {
  try {
    // Get current session
    console.log('1️⃣ Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log('❌ No active session found');
      console.log('\n💡 This test requires you to be logged in to the app.');
      console.log('   Please:');
      console.log('   1. Open your app in the browser');
      console.log('   2. Log in with your account');
      console.log('   3. Then run this test again');
      return;
    }

    console.log('✅ Session found');
    console.log('   User:', session.user.email);
    console.log('   User ID:', session.user.id);

    // Try to upload
    console.log('\n2️⃣ Testing upload with authenticated user...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${session.user.id}-${Date.now()}.txt`;

    console.log('   File name:', testFileName);
    console.log('   Uploading...');

    const uploadPromise = supabase.storage
      .from('avatars')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    // Add timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout after 10 seconds')), 10000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Upload failed:', error.message);
      console.error('   Status:', error.statusCode);
      console.error('   Details:', error);

      if (error.message.includes('policy')) {
        console.log('\n🔍 This is an RLS policy issue on storage.objects');
        console.log('   The INSERT policy may be too restrictive.');
      }
      return;
    }

    console.log('✅ Upload successful!');
    console.log('   Path:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(testFileName);
    console.log('   Public URL:', publicUrl);

    // Clean up
    console.log('\n3️⃣ Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([testFileName]);

    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file deleted');
    }

    console.log('\n✅ All tests passed! Upload should work in the app.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuthenticatedUpload();
