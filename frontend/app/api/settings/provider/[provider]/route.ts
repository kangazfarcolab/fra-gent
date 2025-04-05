import { NextRequest, NextResponse } from 'next/server';

// Use localhost for client-side API routes
const API_URL = 'http://localhost:8000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider;
    const body = await request.json();

    const response = await fetch(`${API_URL}/settings/provider/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update provider settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to update provider settings' },
      { status: 500 }
    );
  }
}
