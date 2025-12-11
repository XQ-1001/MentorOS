import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Get all conversations for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// Create new conversation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database (upsert)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      },
      create: {
        id: user.id,
        email: user.email || undefined,
        name: user.user_metadata?.name || user.email?.split('@')[0] || undefined,
      },
    });

    const { title, language } = await request.json();

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: title || null,
        language: language || 'en',
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
