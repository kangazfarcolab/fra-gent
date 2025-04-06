import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../../config';

interface RouteParams {
  params: {
    id: string;
    executionId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, executionId } = params;

    const response = await fetch(`${API_URL}/api/workflows/test/${id}/executions/${executionId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching execution details: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in execution details GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution details' },
      { status: 500 }
    );
  }
}
