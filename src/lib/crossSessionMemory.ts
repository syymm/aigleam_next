import { PrismaClient, MemoryType } from '@prisma/client';
import { semanticMemorySystem, SemanticSearchResult } from './memorySystem';
import { userProfileSystem } from './userProfileSystem';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CrossSessionContext {
  userId: number;
  currentConversationId: string;
  query: string;
  contextWindow: number;
}

export interface LongTermMemory {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  summary: string;
  importance: number;
  relevance: number;
  lastAccessed: Date;
  relatedConversations: string[];
}

export class CrossSessionMemorySystem {
  private readonly CONSOLIDATION_THRESHOLD = 5; // 访问次数阈值
  private readonly RELEVANCE_THRESHOLD = 0.6;
  private readonly MAX_CROSS_SESSION_CONTEXT = 10;

  async consolidateMemories(userId: number): Promise<void> {
    try {
      const candidateMemories = await this.findConsolidationCandidates(userId);
      
      for (const memory of candidateMemories) {
        await this.consolidateMemory(memory);
      }
      
      await this.cleanupOldMemories(userId);
    } catch (error) {
      console.error('Error consolidating memories:', error);
    }
  }

  private async findConsolidationCandidates(userId: number): Promise<any[]> {
    return await prisma.memoryEntry.findMany({
      where: {
        userId,
        accessCount: { gte: this.CONSOLIDATION_THRESHOLD },
        type: { in: [MemoryType.FACT, MemoryType.KNOWLEDGE, MemoryType.EXPERIENCE] },
        createdAt: {
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
        }
      },
      orderBy: [
        { importanceScore: 'desc' },
        { accessCount: 'desc' }
      ]
    });
  }

  private async consolidateMemory(memory: any): Promise<void> {
    try {
      const summary = await this.generateConsolidatedSummary(memory.content);
      const relatedMemories = await this.findRelatedMemories(memory.userId, memory.content);
      
      const consolidatedMemory = await prisma.memoryEntry.create({
        data: {
          userId: memory.userId,
          type: MemoryType.KNOWLEDGE,
          title: `Consolidated: ${memory.title}`,
          content: summary,
          context: `Consolidated from ${relatedMemories.length + 1} related memories`,
          importanceScore: Math.min(memory.importanceScore + 2, 10),
          decayRate: 0.05, // 更慢的遗忘率
          reinforcements: memory.reinforcements + 1,
          tags: memory.tags,
          relatedTopics: memory.relatedTopics,
        }
      });

      await this.linkRelatedMemories(consolidatedMemory.id, relatedMemories);
      
      await prisma.memoryEntry.update({
        where: { id: memory.id },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error consolidating memory:', error);
    }
  }

  private async generateConsolidatedSummary(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Create a comprehensive summary that consolidates the key information from this content. Focus on the most important facts and insights:\n\n${content}`
        }],
        max_tokens: 300,
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('Error generating consolidated summary:', error);
      return content;
    }
  }

  private async findRelatedMemories(userId: number, content: string): Promise<any[]> {
    const keywords = await this.extractKeywords(content);
    
    return await prisma.memoryEntry.findMany({
      where: {
        userId,
        isActive: true,
        OR: keywords.map(keyword => ({
          OR: [
            { content: { contains: keyword, mode: 'insensitive' } },
            { tags: { has: keyword } },
            { relatedTopics: { has: keyword } }
          ]
        }))
      },
      take: 5
    });
  }

  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract the 5 most important keywords from this text:\n\n${text}`
        }],
        max_tokens: 50,
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content
        ?.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0) || [];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  private async linkRelatedMemories(consolidatedMemoryId: string, relatedMemories: any[]): Promise<void> {
    for (const memory of relatedMemories) {
      await prisma.memoryEntry.update({
        where: { id: memory.id },
        data: {
          context: `${memory.context} [Linked to consolidated memory: ${consolidatedMemoryId}]`
        }
      });
    }
  }

  async getCrossSessionContext(context: CrossSessionContext): Promise<LongTermMemory[]> {
    try {
      const [semanticResults, structuredMemories, userContext] = await Promise.all([
        semanticMemorySystem.searchSemanticMemory(context.query, context.userId, 5),
        this.searchStructuredMemories(context),
        this.getUserContextMemories(context.userId)
      ]);

      const combinedResults = this.combineAndRankResults(
        semanticResults,
        structuredMemories,
        userContext
      );

      return combinedResults.slice(0, this.MAX_CROSS_SESSION_CONTEXT);
    } catch (error) {
      console.error('Error getting cross-session context:', error);
      return [];
    }
  }

  private async searchStructuredMemories(context: CrossSessionContext): Promise<any[]> {
    const keywords = await this.extractKeywords(context.query);
    
    return await prisma.memoryEntry.findMany({
      where: {
        userId: context.userId,
        isActive: true,
        conversationId: { not: context.currentConversationId },
        OR: [
          { content: { contains: context.query, mode: 'insensitive' } },
          ...keywords.map(keyword => ({
            OR: [
              { tags: { has: keyword } },
              { relatedTopics: { has: keyword } },
              { title: { contains: keyword, mode: 'insensitive' } }
            ]
          } as any))
        ]
      },
      orderBy: [
        { importanceScore: 'desc' },
        { lastAccessed: 'desc' }
      ],
      take: 10
    });
  }

  private async getUserContextMemories(userId: number): Promise<any[]> {
    const userPersonalization = await userProfileSystem.getUserPersonalization(userId);
    
    if (!userPersonalization.preferences) {
      return [];
    }

    const { preferredTopics, knowledgeAreas } = userPersonalization.preferences;
    const allTopics = [...preferredTopics, ...knowledgeAreas];

    return await prisma.memoryEntry.findMany({
      where: {
        userId,
        isActive: true,
        OR: allTopics.map(topic => ({
          OR: [
            { tags: { has: topic } },
            { relatedTopics: { has: topic } }
          ]
        })),
        lastAccessed: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      orderBy: { importanceScore: 'desc' },
      take: 5
    });
  }

  private combineAndRankResults(
    semanticResults: SemanticSearchResult[],
    structuredMemories: any[],
    userContext: any[]
  ): LongTermMemory[] {
    const combinedResults: LongTermMemory[] = [];
    
    // 添加语义搜索结果
    semanticResults.forEach(result => {
      combinedResults.push({
        id: result.id,
        type: MemoryType.KNOWLEDGE,
        title: result.summary.substring(0, 50) + '...',
        content: result.content,
        summary: result.summary,
        importance: result.importanceScore,
        relevance: result.similarity,
        lastAccessed: result.lastAccessed,
        relatedConversations: []
      });
    });

    // 添加结构化记忆
    structuredMemories.forEach(memory => {
      combinedResults.push({
        id: memory.id,
        type: memory.type,
        title: memory.title,
        content: memory.content,
        summary: memory.content.substring(0, 200) + '...',
        importance: memory.importanceScore,
        relevance: 0.8, // 结构化搜索的默认相关性
        lastAccessed: memory.lastAccessed,
        relatedConversations: memory.conversationId ? [memory.conversationId] : []
      });
    });

    // 添加用户上下文记忆
    userContext.forEach(memory => {
      combinedResults.push({
        id: memory.id,
        type: memory.type,
        title: memory.title,
        content: memory.content,
        summary: memory.content.substring(0, 200) + '...',
        importance: memory.importanceScore,
        relevance: 0.6, // 用户上下文的默认相关性
        lastAccessed: memory.lastAccessed,
        relatedConversations: memory.conversationId ? [memory.conversationId] : []
      });
    });

    // 去重并按综合得分排序
    const uniqueResults = this.deduplicateResults(combinedResults);
    
    return uniqueResults.sort((a, b) => {
      const scoreA = a.relevance * 0.6 + (a.importance / 10) * 0.4;
      const scoreB = b.relevance * 0.6 + (b.importance / 10) * 0.4;
      return scoreB - scoreA;
    });
  }

  private deduplicateResults(results: LongTermMemory[]): LongTermMemory[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
  }

  async reinforceMemory(memoryId: string, reinforcementStrength: number = 1): Promise<void> {
    try {
      await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
          reinforcements: { increment: reinforcementStrength },
          importanceScore: { increment: reinforcementStrength * 0.5 },
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        }
      });
    } catch (error) {
      console.error('Error reinforcing memory:', error);
    }
  }

  async createCrossSessionSummary(
    userId: number,
    conversationId: string,
    sessionSummary: string
  ): Promise<void> {
    try {
      const importance = await this.calculateSessionImportance(sessionSummary, userId);
      const topics = await this.extractTopics(sessionSummary);
      
      await prisma.memoryEntry.create({
        data: {
          userId,
          conversationId,
          type: MemoryType.EXPERIENCE,
          title: `Session Summary - ${new Date().toLocaleDateString()}`,
          content: sessionSummary,
          context: 'Cross-session summary',
          importanceScore: importance,
          tags: topics,
          relatedTopics: topics,
          decayRate: 0.1,
        }
      });

      // 更新会话统计
      await userProfileSystem.updateSessionStats(userId, 1);
    } catch (error) {
      console.error('Error creating cross-session summary:', error);
    }
  }

  private async calculateSessionImportance(summary: string, userId: number): Promise<number> {
    const userPersonalization = await userProfileSystem.getUserPersonalization(userId);
    const topics = await this.extractTopics(summary);
    
    let importance = 5; // 基础重要性
    
    // 如果包含用户感兴趣的话题
    if (userPersonalization.preferences) {
      const commonTopics = topics.filter(topic => 
        userPersonalization.preferences!.preferredTopics.includes(topic) ||
        userPersonalization.preferences!.knowledgeAreas.includes(topic)
      );
      importance += commonTopics.length * 2;
    }
    
    // 基于内容长度
    if (summary.length > 500) importance += 1;
    if (summary.length > 1000) importance += 1;
    
    return Math.min(importance, 10);
  }

  private async extractTopics(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract 3-5 main topics from this text:\n\n${text}`
        }],
        max_tokens: 100,
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content
        ?.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0) || [];
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }

  private async cleanupOldMemories(userId: number): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90天前
      
      await prisma.memoryEntry.updateMany({
        where: {
          userId,
          createdAt: { lt: cutoffDate },
          importanceScore: { lt: 3 },
          accessCount: { lt: 2 }
        },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error cleaning up old memories:', error);
    }
  }
}

export const crossSessionMemorySystem = new CrossSessionMemorySystem();