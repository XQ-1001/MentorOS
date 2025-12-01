import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count();

    // Get database info
    const result = await prisma.$queryRaw`SELECT version()`;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      userCount,
      database: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
