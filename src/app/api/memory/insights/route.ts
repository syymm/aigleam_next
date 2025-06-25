import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { memoryManager } from '@/lib/memoryManager';
import { intelligentForgettingSystem } from '@/lib/forgettingSystem';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [memoryInsights, forgettingReport] = await Promise.all([
      memoryManager.generateMemoryInsights(userId),
      intelligentForgettingSystem.generateForgettingReport(userId)
    ]);

    return NextResponse.json({
      insights: memoryInsights,
      report: forgettingReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating memory insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate memory insights' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'consolidate':
        const consolidationResult = await intelligentForgettingSystem.processMemoryDecay(userId);
        return NextResponse.json({
          message: 'Memory consolidation completed',
          result: consolidationResult
        });

      case 'maintenance':
        await memoryManager.performMemoryMaintenance(userId);
        return NextResponse.json({
          message: 'Memory maintenance completed'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing memory action:', error);
    return NextResponse.json(
      { error: 'Failed to process memory action' }, 
      { status: 500 }
    );
  }
}