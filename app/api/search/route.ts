import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { query, numResults = 10, type = 'deep' as const } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await exa.searchAndContents(query, {
      type,
      numResults,
      highlights: {
        maxCharacters: 4000
      }
    });

    return NextResponse.json({
      success: true,
      results: results.results.map(result => ({
        title: result.title,
        url: result.url,
        highlights: result.highlights,
        score: result.score
      }))
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const numResults = parseInt(searchParams.get('numResults') || '10');
  const type = (searchParams.get('type') || 'deep') as 'deep' | 'deep-lite' | 'deep-reasoning' | 'keyword' | 'neural' | 'auto' | 'hybrid' | 'fast' | 'instant';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results = await exa.searchAndContents(query, {
      type,
      numResults,
      highlights: {
        maxCharacters: 4000
      }
    });

    return NextResponse.json({
      success: true,
      results: results.results.map(result => ({
        title: result.title,
        url: result.url,
        highlights: result.highlights,
        score: result.score
      }))
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
