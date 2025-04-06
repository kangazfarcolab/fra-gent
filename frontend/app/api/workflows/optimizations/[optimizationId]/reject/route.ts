import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../../config';

interface RouteParams {
  params: {
    optimizationId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { optimizationId } = params;

    const response = await fetch(`${API_URL}/api/workflows/test/optimizations/${optimizationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error rejecting optimization: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in reject optimization route:', error);
    return NextResponse.json(
      { error: 'Failed to reject optimization' },
      { status: 500 }
    );
  }
}
