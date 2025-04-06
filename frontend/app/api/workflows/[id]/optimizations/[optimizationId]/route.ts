import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../../config';

interface RouteParams {
  params: {
    id: string;
    optimizationId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, optimizationId } = params;

    const response = await fetch(`${API_URL}/api/workflows/test/${id}/optimizations/${optimizationId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching optimization details: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in optimization details GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization details' },
      { status: 500 }
    );
  }
}
