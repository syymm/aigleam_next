import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { semanticMemorySystem } from '@/lib/memorySystem';
import { crossSessionMemorySystem } from '@/lib/crossSessionMemory';

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 10, conversationId } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const [semanticResults, crossSessionResults] = await Promise.all([
      semanticMemorySystem.searchSemanticMemory(query, userId, Math.ceil(limit / 2)),
      crossSessionMemorySystem.getCrossSessionContext({
        userId,
        currentConversationId: conversationId || '',
        query,
        contextWindow: Math.floor(limit / 2)
      })
    ]);

    const combinedResults = [
      ...semanticResults.map(result => ({
        ...result,
        type: 'semantic',
        relevanceScore: result.similarity
      })),
      ...crossSessionResults.map(result => ({
        ...result,
        type: 'cross-session',
        relevanceScore: result.relevance
      }))
    ]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

    return NextResponse.json({
      results: combinedResults,
      total: combinedResults.length,
      query
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    return NextResponse.json(
      { error: 'Failed to search memories' }, 
      { status: 500 }
    );
  }
}