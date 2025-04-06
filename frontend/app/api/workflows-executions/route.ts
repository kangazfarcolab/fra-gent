import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../config';

export async function GET(request: NextRequest) {
  try {
    // Get the ID from the query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    const skip = searchParams.get('skip') || '0';
    const limit = searchParams.get('limit') || '100';
    const status = searchParams.get('status');

    let url = `${API_URL}/api/workflows/test/${id}/executions?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching workflow executions: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in workflow-executions GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow executions' },
      { status: 500 }
    );
  }
}
