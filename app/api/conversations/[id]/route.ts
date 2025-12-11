import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Get single conversation with all messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfStart = performance.now();

  try {
    // Measure auth time
    const authStart = performance.now();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const authTime = performance.now() - authStart;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Measure DB query time
    const queryStart = performance.now();
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });
    const queryTime = performance.now() - queryStart;

    // Security check
    if (conversation && conversation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Reverse messages
    if (conversation) {
      conversation.messages = conversation.messages.reverse();
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const totalTime = performance.now() - perfStart;
    console.log(`[PERF] Conversation ${id}: auth=${authTime.toFixed(0)}ms, query=${queryTime.toFixed(0)}ms, total=${totalTime.toFixed(0)}ms, messages=${conversation.messages.length}`);

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// Update conversation (e.g., rename title)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, language } = await request.json();

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update conversation title and/or language
    const updateData: { title?: string; language?: string } = {};
    if (title !== undefined) updateData.title = title;
    if (language !== undefined) updateData.language = language;

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// Delete conversation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.conversation.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
