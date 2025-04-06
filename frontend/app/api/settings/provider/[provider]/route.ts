import { NextRequest, NextResponse } from 'next/server';

// Use localhost for client-side API routes
const API_URL = 'http://backend:8000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider;

    const response = await fetch(`${API_URL}/settings/provider/${provider}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get provider settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to get provider settings' },
      { status: 500 }
    );
  }
}

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider;

    const response = await fetch(`${API_URL}/settings/provider/${provider}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete provider settings' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider settings' },
      { status: 500 }
    );
  }
}