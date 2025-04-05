import { NextRequest, NextResponse } from 'next/server';

// Use localhost for client-side API routes
const API_URL = 'http://localhost:8000/api';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/settings/all`, {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
