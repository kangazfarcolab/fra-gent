import { NextRequest, NextResponse } from 'next/server';

// Use backend service name for client-side API routes
const API_URL = 'http://backend:8000/api';

export async function GET(request: NextRequest) {
  try {
    // Add a cache-busting parameter to ensure we're not getting cached responses
    const response = await fetch(`${API_URL}/settings/all?_=${Date.now()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Settings all API response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
