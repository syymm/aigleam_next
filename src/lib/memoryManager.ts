import { PrismaClient, MemoryType } from '@prisma/client';
import { semanticMemorySystem, MemoryContext } from './memorySystem';
import { userProfileSystem } from './userProfileSystem';
import { crossSessionMemorySystem, CrossSessionContext, LongTermMemory } from './crossSessionMemory';

const prisma = new PrismaClient();

export interface MemoryLayer {
  shortTerm: ShortTermMemory[];
  workingMemory: WorkingMemory[];
  longTerm: LongTermMemory[];
}

export interface ShortTermMemory {
  id: string;
  content: string;
  timestamp: Date;
  importance: number;
  type: 'user' | 'assistant';
}

export interface WorkingMemory {
  id: string;
  content: string;
  context: string;
  relevance: number;
  lastAccessed: Date;
}

export interface MemoryInsight {
  patterns: string[];
  preferences: Record<string, any>;
  recommendations: string[];
  relationshipMap: Record<string, string[]>;
}

export class HierarchicalMemoryManager {
  private readonly SHORT_TERM_LIMIT = 20;
  private readonly WORKING_MEMORY_LIMIT = 10;
  private readonly LONG_TERM_ACTIVATION_THRESHOLD = 0.6;

  async processMessage(
    userId: number,
    conversationId: string,
    messageId: string,
    content: string,
    isUser: boolean,
    importance: number
  ): Promise<void> {
    try {
      // 1. 短期记忆存储
      await this.addToShortTermMemory(conversationId, messageId, content, isUser, importance);

      // 2. 用户画像分析
      if (isUser) {
        await userProfileSystem.analyzeUserMessage(userId, content, conversationId);
      }

      // 3. 语义记忆存储
      if (importance > 5) {
        const memoryContext: MemoryContext = {
          userId,
          conversationId,
          messageId
        };
        await semanticMemorySystem.storeSemanticMemory(content, memoryContext, importance);
      }

      // 4. 工作记忆更新
      await this.updateWorkingMemory(userId, conversationId, content);

      // 5. 定期记忆整理
      if (Math.random() < 0.1) { // 10% 概率进行记忆整理
        await this.performMemoryMaintenance(userId);
      }
    } catch (error) {
      console.error('Error processing message in memory manager:', error);
    }
  }

  private async addToShortTermMemory(
    conversationId: string,
    messageId: string,
    content: string,
    isUser: boolean,
    importance: number
  ): Promise<void> {
    try {
      const shortTermKey = `short_term:${conversationId}`;
      
      // 模拟短期记忆存储（实际可以使用 Redis 等缓存）
      const memory: ShortTermMemory = {
        id: messageId,
        content,
        timestamp: new Date(),
        importance,
        type: isUser ? 'user' : 'assistant'
      };

      // 这里使用数据库临时存储，实际应用中建议使用内存缓存
      await this.storeTemporaryMemory(conversationId, memory);
    } catch (error) {
      console.error('Error adding to short-term memory:', error);
    }
  }

  private async storeTemporaryMemory(conversationId: string, memory: ShortTermMemory): Promise<void> {
    // 临时存储方案，实际应该使用 Redis 或其他缓存
    try {
      await prisma.memoryEntry.create({
        data: {
          userId: 0, // 临时用户ID，仅用于短期记忆
          conversationId,
          type: MemoryType.EXPERIENCE,
          title: 'Short-term memory',
          content: JSON.stringify(memory),
          importanceScore: memory.importance,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
          tags: ['short-term'],
          relatedTopics: [],
        }
      });
    } catch (error) {
      console.error('Error storing temporary memory:', error);
    }
  }

  private async updateWorkingMemory(
    userId: number,
    conversationId: string,
    content: string
  ): Promise<void> {
    try {
      // 搜索相关记忆
      const relatedMemories = await semanticMemorySystem.searchSemanticMemory(content, userId, 5);
      
      // 更新工作记忆
      for (const memory of relatedMemories) {
        await this.addToWorkingMemory(userId, conversationId, memory.content, memory.similarity);
      }
    } catch (error) {
      console.error('Error updating working memory:', error);
    }
  }

  private async addToWorkingMemory(
    userId: number,
    conversationId: string,
    content: string,
    relevance: number
  ): Promise<void> {
    try {
      await prisma.memoryEntry.upsert({
        where: {
          id: `working_${userId}_${conversationId}_${Date.now()}`
        },
        update: {
          lastAccessed: new Date(),
          accessCount: { increment: 1 }
        },
        create: {
          id: `working_${userId}_${conversationId}_${Date.now()}`,
          userId,
          conversationId,
          type: MemoryType.EXPERIENCE,
          title: 'Working memory',
          content,
          context: 'Active working memory',
          importanceScore: relevance * 10,
          tags: ['working-memory'],
          relatedTopics: [],
        }
      });
    } catch (error) {
      console.error('Error adding to working memory:', error);
    }
  }

  async getMemoryLayers(
    userId: number,
    conversationId: string,
    query?: string
  ): Promise<MemoryLayer> {
    try {
      const [shortTerm, workingMemory, longTerm] = await Promise.all([
        this.getShortTermMemory(conversationId),
        this.getWorkingMemory(userId, conversationId),
        this.getLongTermMemory(userId, conversationId, query)
      ]);

      return {
        shortTerm,
        workingMemory,
        longTerm
      };
    } catch (error) {
      console.error('Error getting memory layers:', error);
      return {
        shortTerm: [],
        workingMemory: [],
        longTerm: []
      };
    }
  }

  private async getShortTermMemory(conversationId: string): Promise<ShortTermMemory[]> {
    try {
      const memories = await prisma.memoryEntry.findMany({
        where: {
          conversationId,
          tags: { has: 'short-term' },
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        take: this.SHORT_TERM_LIMIT
      });

      return memories.map(memory => {
        const parsed = JSON.parse(memory.content);
        return {
          id: parsed.id || memory.id,
          content: parsed.content || memory.content,
          timestamp: new Date(parsed.timestamp || memory.createdAt),
          importance: parsed.importance || memory.importanceScore,
          type: parsed.type || 'assistant'
        };
      });
    } catch (error) {
      console.error('Error getting short-term memory:', error);
      return [];
    }
  }

  private async getWorkingMemory(userId: number, conversationId: string): Promise<WorkingMemory[]> {
    try {
      const memories = await prisma.memoryEntry.findMany({
        where: {
          userId,
          conversationId,
          tags: { has: 'working-memory' },
          isActive: true
        },
        orderBy: { lastAccessed: 'desc' },
        take: this.WORKING_MEMORY_LIMIT
      });

      return memories.map(memory => ({
        id: memory.id,
        content: memory.content,
        context: memory.context || '',
        relevance: memory.importanceScore / 10,
        lastAccessed: memory.lastAccessed
      }));
    } catch (error) {
      console.error('Error getting working memory:', error);
      return [];
    }
  }

  private async getLongTermMemory(
    userId: number,
    conversationId: string,
    query?: string
  ): Promise<LongTermMemory[]> {
    try {
      if (!query) {
        return [];
      }

      const context: CrossSessionContext = {
        userId,
        currentConversationId: conversationId,
        query,
        contextWindow: 10
      };

      return await crossSessionMemorySystem.getCrossSessionContext(context);
    } catch (error) {
      console.error('Error getting long-term memory:', error);
      return [];
    }
  }

  async generateMemoryInsights(userId: number): Promise<MemoryInsight> {
    try {
      const userPersonalization = await userProfileSystem.getUserPersonalization(userId);
      const recentMemories = await this.getRecentMemories(userId, 50);
      
      const patterns = await this.identifyPatterns(recentMemories);
      const relationshipMap = await this.buildRelationshipMap(userId);
      const recommendations = await this.generateRecommendations(userPersonalization, patterns);

      return {
        patterns,
        preferences: userPersonalization.preferences || {},
        recommendations,
        relationshipMap
      };
    } catch (error) {
      console.error('Error generating memory insights:', error);
      return {
        patterns: [],
        preferences: {},
        recommendations: [],
        relationshipMap: {}
      };
    }
  }

  private async getRecentMemories(userId: number, limit: number): Promise<any[]> {
    return await prisma.memoryEntry.findMany({
      where: {
        userId,
        isActive: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  private async identifyPatterns(memories: any[]): Promise<string[]> {
    const topicCounts: Record<string, number> = {};
    const timePattens: Record<string, number> = {};

    memories.forEach(memory => {
      // 统计话题频率
      memory.relatedTopics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });

      // 统计时间模式
      const hour = new Date(memory.createdAt).getHours();
      const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 4}`;
      timePattens[timeSlot] = (timePattens[timeSlot] || 0) + 1;
    });

    const patterns: string[] = [];
    
    // 识别高频话题
    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
    
    if (topTopics.length > 0) {
      patterns.push(`Frequently discussed topics: ${topTopics.join(', ')}`);
    }

    // 识别活跃时间段
    const activeTime = Object.entries(timePattens)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (activeTime) {
      patterns.push(`Most active time: ${activeTime[0]} hours`);
    }

    return patterns;
  }

  private async buildRelationshipMap(userId: number): Promise<Record<string, string[]>> {
    const relationships: Record<string, string[]> = {};
    
    const memories = await prisma.semanticMemory.findMany({
      where: { userId },
      include: {
        relatedMemories: {
          include: { toMemory: true }
        }
      },
      take: 100
    });

    memories.forEach(memory => {
      const relatedIds = memory.relatedMemories.map(rel => rel.toMemory.id);
      relationships[memory.id] = relatedIds;
    });

    return relationships;
  }

  private async generateRecommendations(
    userPersonalization: any,
    patterns: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (userPersonalization.preferences?.preferredTopics.length > 0) {
      recommendations.push('Continue exploring your favorite topics');
    }

    if (patterns.some(p => p.includes('active time'))) {
      recommendations.push('Consider scheduling important conversations during your active hours');
    }

    if (userPersonalization.behavior?.avgSessionLength < 5) {
      recommendations.push('Try longer conversations for deeper engagement');
    }

    return recommendations;
  }

  async performMemoryMaintenance(userId: number): Promise<void> {
    try {
      // 1. 记忆整合
      await crossSessionMemorySystem.consolidateMemories(userId);

      // 2. 清理过期的短期记忆
      await this.cleanupExpiredMemories();

      // 3. 更新记忆重要性评分
      await this.updateMemoryScores(userId);

      // 4. 优化工作记忆
      await this.optimizeWorkingMemory(userId);
    } catch (error) {
      console.error('Error performing memory maintenance:', error);
    }
  }

  private async cleanupExpiredMemories(): Promise<void> {
    try {
      await prisma.memoryEntry.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired memories:', error);
    }
  }

  private async updateMemoryScores(userId: number): Promise<void> {
    try {
      const memories = await prisma.memoryEntry.findMany({
        where: { userId, isActive: true }
      });

      for (const memory of memories) {
        const newScore = await this.calculateDecayedScore(memory);
        
        await prisma.memoryEntry.update({
          where: { id: memory.id },
          data: { importanceScore: newScore }
        });
      }
    } catch (error) {
      console.error('Error updating memory scores:', error);
    }
  }

  private async calculateDecayedScore(memory: any): Promise<number> {
    const daysSinceCreation = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceAccess = (Date.now() - new Date(memory.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    
    const decayFactor = Math.exp(-memory.decayRate * daysSinceAccess);
    const reinforcementBonus = Math.log(memory.reinforcements + 1) * 0.5;
    
    const newScore = (memory.importanceScore * decayFactor) + reinforcementBonus;
    
    return Math.max(0, Math.min(10, newScore));
  }

  private async optimizeWorkingMemory(userId: number): Promise<void> {
    try {
      // 清理低相关性的工作记忆
      await prisma.memoryEntry.updateMany({
        where: {
          userId,
          tags: { has: 'working-memory' },
          importanceScore: { lt: 3 },
          lastAccessed: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
          }
        },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Error optimizing working memory:', error);
    }
  }
}

export const memoryManager = new HierarchicalMemoryManager();