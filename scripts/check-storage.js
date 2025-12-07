const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase Storage Configuration...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  try {
    console.log('\n📦 Listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log('✅ Buckets found:', buckets.length);
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public}, id: ${bucket.id})`);
    });

    // Check if 'avatars' bucket exists
    const avatarsBucket = buckets.find(b => b.name === 'avatars');

    if (!avatarsBucket) {
      console.log('\n⚠️  "avatars" bucket NOT FOUND!');
      console.log('Creating "avatars" bucket...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 2097152 // 2MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log('✅ "avatars" bucket created successfully!');
      }
    } else {
      console.log('\n✅ "avatars" bucket exists!');
      console.log('   Public:', avatarsBucket.public);
      console.log('   ID:', avatarsBucket.id);

      // Try to list files in the bucket
      console.log('\n📁 Listing files in avatars bucket...');
      const { data: files, error: filesError } = await supabase.storage
        .from('avatars')
        .list();

      if (filesError) {
        console.error('❌ Error listing files:', filesError);
      } else {
        console.log(`✅ Found ${files.length} files`);
        files.forEach(file => {
          console.log(`  - ${file.name}`);
        });
      }
    }

    // Test upload
    console.log('\n🧪 Testing file upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful!');
      console.log('   Path:', uploadData.path);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(testFileName);
      console.log('   Public URL:', publicUrl);

      // Clean up test file
      await supabase.storage.from('avatars').remove([testFileName]);
      console.log('   (Test file cleaned up)');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkStorage();
