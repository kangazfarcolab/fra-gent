import { NextRequest, NextResponse } from 'next/server';

// Use backend service name for client-side API routes
const API_URL = 'http://localhost:8000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const response = await fetch(`${API_URL}/agents/${id}/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to interact with agent' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error interacting with agent:', error);
    return NextResponse.json(
      { error: 'Failed to interact with agent' },
      { status: 500 }
    );
  }
}
