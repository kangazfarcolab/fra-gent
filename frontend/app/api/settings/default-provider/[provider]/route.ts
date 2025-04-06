import { NextRequest, NextResponse } from 'next/server';

// Use backend service name for client-side API routes
const API_URL = 'http://backend:8000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider;

    const response = await fetch(`${API_URL}/settings/default-provider/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to set default provider' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error setting default provider:', error);
    return NextResponse.json(
      { error: 'Failed to set default provider' },
      { status: 500 }
    );
  }
}
