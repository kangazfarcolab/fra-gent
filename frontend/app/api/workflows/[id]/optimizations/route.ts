import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../config';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');

    let url = `${API_URL}/api/workflows/test/${id}/optimizations`;
    if (status) {
      url += `?status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching workflow optimizations: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workflow optimizations GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow optimizations' },
      { status: 500 }
    );
  }
}
