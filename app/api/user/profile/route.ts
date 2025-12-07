import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    console.log('[API] Profile update request received');

    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API] Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API] Authenticated user:', user.id);

    // Parse request body
    const body = await request.json();
    const { display_name, avatar_url } = body;

    console.log('[API] Update data:', { display_name, avatar_url, user_id: user.id });

    // First, try to update the profile
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select();

    console.log('[API] Update result:', { updateData, updateError });

    // If no rows were updated, the profile doesn't exist - create it
    if (updateData && updateData.length === 0) {
      console.log('[API] No profile found, creating new profile...');

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('[API] Insert error:', insertError);
        return NextResponse.json(
          { error: insertError.message, details: insertError },
          { status: 500 }
        );
      }

      console.log('[API] Insert successful:', insertData);

      return NextResponse.json({
        success: true,
        data: insertData
      });
    }

    if (updateError) {
      console.error('[API] Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message, details: updateError },
        { status: 500 }
      );
    }

    console.log('[API] Update successful:', updateData);

    return NextResponse.json({
      success: true,
      data: updateData
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
