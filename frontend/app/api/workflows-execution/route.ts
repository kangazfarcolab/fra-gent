import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../config';

export async function GET(request: NextRequest) {
  try {
    // Get the ID and executionId from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const executionId = searchParams.get('executionId');
    
    if (!id || !executionId) {
      return NextResponse.json(
        { error: 'ID and executionId parameters are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/workflows/test/${id}/executions/${executionId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching workflow execution: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workflow-execution GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow execution' },
      { status: 500 }
    );
  }
}
