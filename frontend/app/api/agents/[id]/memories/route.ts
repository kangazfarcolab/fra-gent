import { NextRequest, NextResponse } from 'next/server';

// Use backend service name for client-side API routes
const API_URL = 'http://localhost:8000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // For now, return an empty array since we don't have a real memories endpoint yet
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching agent memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent memories' },
      { status: 500 }
    );
  }
}
