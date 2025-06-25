import { PrismaClient, MemoryType } from '@prisma/client';
import { semanticMemorySystem } from './memorySystem';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ForgettingStrategy {
  name: string;
  description: string;
  priority: number;
  condition: (memory: any) => boolean | Promise<boolean>;
  action: (memory: any) => Promise<void>;
}

export interface MemoryDecayConfig {
  baseDecayRate: number;
  accessBonus: number;
  importanceMultiplier: number;
  timeThreshold: number; // days
  maxRetentionPeriod: number; // days
}

export class IntelligentForgettingSystem {
  private readonly DEFAULT_DECAY_CONFIG: MemoryDecayConfig = {
    baseDecayRate: 0.1,
    accessBonus: 0.05,
    importanceMultiplier: 0.2,
    timeThreshold: 7, // 7天
    maxRetentionPeriod: 365 // 1年
  };

  private forgettingStrategies: ForgettingStrategy[] = [
    {
      name: 'Redundant Information Removal',
      description: '删除冗余和重复的信息',
      priority: 1,
      condition: (memory) => this.isRedundantMemory(memory),
      action: async (memory) => this.softDelete(memory.id)
    },
    {
      name: 'Low Importance Decay',
      description: '降低重要性评分过低的记忆',
      priority: 2,
      condition: (memory) => memory.importanceScore < 2 && this.isOldMemory(memory, 30),
      action: async (memory) => this.accelerateDecay(memory.id)
    },
    {
      name: 'Unused Memory Cleanup',
      description: '清理长期未访问的记忆',
      priority: 3,
      condition: (memory) => this.isUnusedMemory(memory, 60),
      action: async (memory) => this.gradualFade(memory.id)
    },
    {
      name: 'Emotional Context Preservation',
      description: '保护情感相关的重要记忆',
      priority: 4,
      condition: (memory) => this.hasEmotionalContext(memory),
      action: async (memory) => this.preserveMemory(memory.id)
    },
    {
      name: 'Seasonal Memory Reactivation',
      description: '季节性重新激活相关记忆',
      priority: 5,
      condition: (memory) => this.isSeasonallyRelevant(memory),
      action: async (memory) => this.reactivateMemory(memory.id)
    }
  ];

  async processMemoryDecay(userId: number): Promise<{
    processed: number;
    deleted: number;
    preserved: number;
    reactivated: number;
  }> {
    try {
      const memories = await this.getAllActiveMemories(userId);
      const results = {
        processed: 0,
        deleted: 0,
        preserved: 0,
        reactivated: 0
      };

      for (const memory of memories) {
        const strategy = await this.selectOptimalStrategy(memory);
        
        if (strategy) {
          await strategy.action(memory);
          results.processed++;
          
          // 统计不同操作类型
          if (strategy.name.includes('Removal') || strategy.name.includes('Cleanup')) {
            results.deleted++;
          } else if (strategy.name.includes('Preservation')) {
            results.preserved++;
          } else if (strategy.name.includes('Reactivation')) {
            results.reactivated++;
          }
        }
      }

      // 执行全局记忆优化
      await this.performGlobalOptimization(userId);

      return results;
    } catch (error) {
      console.error('Error processing memory decay:', error);
      return { processed: 0, deleted: 0, preserved: 0, reactivated: 0 };
    }
  }

  private async getAllActiveMemories(userId: number): Promise<any[]> {
    return await prisma.memoryEntry.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        user: {
          include: {
            userProfile: true
          }
        }
      }
    });
  }

  private async selectOptimalStrategy(memory: any): Promise<ForgettingStrategy | null> {
    const applicableStrategies = [];
    
    for (const strategy of this.forgettingStrategies) {
      const condition = strategy.condition(memory);
      const isApplicable = condition instanceof Promise ? await condition : condition;
      if (isApplicable) {
        applicableStrategies.push(strategy);
      }
    }
    
    applicableStrategies.sort((a, b) => a.priority - b.priority);
    return applicableStrategies[0] || null;
  }

  private async isRedundantMemory(memory: any): Promise<boolean> {
    try {
      // 使用语义搜索找到相似的记忆
      const similarMemories = await semanticMemorySystem.searchSemanticMemory(
        memory.content,
        memory.userId,
        5
      );

      // 检查是否有高相似度的记忆
      const redundant = similarMemories.some(similar => 
        similar.id !== memory.id && 
        similar.similarity > 0.9 &&
        similar.importanceScore >= memory.importanceScore
      );

      return redundant;
    } catch (error) {
      console.error('Error checking redundant memory:', error);
      return false;
    }
  }

  private isOldMemory(memory: any, days: number): boolean {
    const ageInDays = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > days;
  }

  private isUnusedMemory(memory: any, days: number): boolean {
    const lastAccessedDays = (Date.now() - new Date(memory.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
    return lastAccessedDays > days && memory.accessCount < 3;
  }

  private async hasEmotionalContext(memory: any): Promise<boolean> {
    try {
      const emotionalKeywords = [
        'happy', 'sad', 'angry', 'excited', 'worried', 'grateful', 'proud',
        'disappointed', 'surprised', 'confused', 'frustrated', 'relieved',
        '开心', '难过', '生气', '兴奋', '担心', '感谢', '骄傲', '失望', '惊讶', '困惑', '沮丧', '安心'
      ];

      const hasEmotionalKeywords = emotionalKeywords.some(keyword =>
        memory.content.toLowerCase().includes(keyword) ||
        memory.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
      );

      if (hasEmotionalKeywords) return true;

      // 使用AI分析情感强度
      const emotionalIntensity = await this.analyzeEmotionalIntensity(memory.content);
      return emotionalIntensity > 0.6;
    } catch (error) {
      console.error('Error checking emotional context:', error);
      return false;
    }
  }

  private async analyzeEmotionalIntensity(content: string): Promise<number> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Rate the emotional intensity of this text on a scale of 0-1, where 0 is neutral and 1 is highly emotional. Return only the number:\n\n${content}`
        }],
        max_tokens: 10,
        temperature: 0.1,
      });

      const intensity = parseFloat(response.choices[0]?.message?.content || '0');
      return Math.max(0, Math.min(1, intensity));
    } catch (error) {
      console.error('Error analyzing emotional intensity:', error);
      return 0;
    }
  }

  private isSeasonallyRelevant(memory: any): boolean {
    const currentMonth = new Date().getMonth();
    const memoryMonth = new Date(memory.createdAt).getMonth();
    
    // 检查是否在相同季节（相差3个月内）
    const monthDiff = Math.abs(currentMonth - memoryMonth);
    const isSeasonalMatch = monthDiff <= 1 || monthDiff >= 11;
    
    // 检查季节性关键词
    const seasonalKeywords = [
      'spring', 'summer', 'autumn', 'winter', 'holiday', 'birthday', 'anniversary',
      '春天', '夏天', '秋天', '冬天', '假期', '生日', '纪念日', '节日'
    ];
    
    const hasSeasonalKeywords = seasonalKeywords.some(keyword =>
      memory.content.toLowerCase().includes(keyword) ||
      memory.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
    );

    return isSeasonalMatch && hasSeasonalKeywords;
  }

  private async softDelete(memoryId: string): Promise<void> {
    try {
      await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error soft deleting memory:', error);
    }
  }

  private async accelerateDecay(memoryId: string): Promise<void> {
    try {
      await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
          decayRate: { multiply: 2 },
          importanceScore: { multiply: 0.5 },
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error accelerating decay:', error);
    }
  }

  private async gradualFade(memoryId: string): Promise<void> {
    try {
      const memory = await prisma.memoryEntry.findUnique({
        where: { id: memoryId }
      });

      if (memory && memory.importanceScore > 1) {
        await prisma.memoryEntry.update({
          where: { id: memoryId },
          data: {
            importanceScore: { decrement: 1 },
            decayRate: { increment: 0.05 },
            updatedAt: new Date()
          }
        });
      } else {
        await this.softDelete(memoryId);
      }
    } catch (error) {
      console.error('Error gradual fading memory:', error);
    }
  }

  private async preserveMemory(memoryId: string): Promise<void> {
    try {
      await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
          importanceScore: { increment: 1 },
          decayRate: { multiply: 0.5 },
          reinforcements: { increment: 1 },
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error preserving memory:', error);
    }
  }

  private async reactivateMemory(memoryId: string): Promise<void> {
    try {
      await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
          importanceScore: { increment: 2 },
          lastAccessed: new Date(),
          accessCount: { increment: 1 },
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error reactivating memory:', error);
    }
  }

  private async performGlobalOptimization(userId: number): Promise<void> {
    try {
      // 1. 清理过期记忆
      await this.cleanupExpiredMemories(userId);
      
      // 2. 平衡记忆分布
      await this.balanceMemoryDistribution(userId);
      
      // 3. 强化重要关联
      await this.reinforceImportantConnections(userId);
    } catch (error) {
      console.error('Error performing global optimization:', error);
    }
  }

  private async cleanupExpiredMemories(userId: number): Promise<void> {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - this.DEFAULT_DECAY_CONFIG.maxRetentionPeriod);

    await prisma.memoryEntry.updateMany({
      where: {
        userId,
        createdAt: { lt: expiredDate },
        importanceScore: { lt: 1 }
      },
      data: { isActive: false }
    });
  }

  private async balanceMemoryDistribution(userId: number): Promise<void> {
    const memoryTypeCounts = await prisma.memoryEntry.groupBy({
      by: ['type'],
      where: {
        userId,
        isActive: true
      },
      _count: { type: true }
    });

    // 如果某种类型的记忆过多，降低其重要性
    const maxCountPerType = 100;
    
    for (const typeCount of memoryTypeCounts) {
      if (typeCount._count.type > maxCountPerType) {
        const excessMemories = await prisma.memoryEntry.findMany({
          where: {
            userId,
            type: typeCount.type,
            isActive: true
          },
          orderBy: [
            { importanceScore: 'asc' },
            { lastAccessed: 'asc' }
          ],
          take: typeCount._count.type - maxCountPerType
        });

        for (const memory of excessMemories) {
          await this.gradualFade(memory.id);
        }
      }
    }
  }

  private async reinforceImportantConnections(userId: number): Promise<void> {
    try {
      // 找到高度连接的记忆节点
      const highConnectedMemories = await prisma.semanticMemory.findMany({
        where: { userId },
        include: {
          relatedMemories: true,
          referencedBy: true
        }
      });

      for (const memory of highConnectedMemories) {
        const connectionCount = memory.relatedMemories.length + memory.referencedBy.length;
        
        if (connectionCount > 5) {
          // 强化高连接度的记忆
          await prisma.semanticMemory.update({
            where: { id: memory.id },
            data: {
              importanceScore: { increment: 1 },
              accessCount: { increment: 1 }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error reinforcing important connections:', error);
    }
  }

  async generateForgettingReport(userId: number): Promise<{
    totalMemories: number;
    activeMemories: number;
    decayingMemories: number;
    preservedMemories: number;
    memoryHealth: number;
    recommendations: string[];
  }> {
    try {
      const [total, active, decaying, preserved] = await Promise.all([
        prisma.memoryEntry.count({ where: { userId } }),
        prisma.memoryEntry.count({ where: { userId, isActive: true } }),
        prisma.memoryEntry.count({ where: { userId, isActive: true, importanceScore: { lt: 5 } } }),
        prisma.memoryEntry.count({ where: { userId, isActive: true, importanceScore: { gte: 8 } } })
      ]);

      const memoryHealth = active > 0 ? (preserved / active) * 100 : 0;
      
      const recommendations = this.generateRecommendations(memoryHealth, active, decaying);

      return {
        totalMemories: total,
        activeMemories: active,
        decayingMemories: decaying,
        preservedMemories: preserved,
        memoryHealth: Math.round(memoryHealth),
        recommendations
      };
    } catch (error) {
      console.error('Error generating forgetting report:', error);
      return {
        totalMemories: 0,
        activeMemories: 0,
        decayingMemories: 0,
        preservedMemories: 0,
        memoryHealth: 0,
        recommendations: []
      };
    }
  }

  private generateRecommendations(
    memoryHealth: number,
    activeMemories: number,
    decayingMemories: number
  ): string[] {
    const recommendations: string[] = [];

    if (memoryHealth < 30) {
      recommendations.push('Memory health is low. Consider engaging in more meaningful conversations.');
    }

    if (activeMemories > 1000) {
      recommendations.push('High memory load detected. Consider periodic memory cleanup.');
    }

    if (decayingMemories > activeMemories * 0.5) {
      recommendations.push('Many memories are decaying. Try to revisit important topics.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory system is well-balanced and healthy.');
    }

    return recommendations;
  }

  async scheduleMemoryMaintenance(userId: number): Promise<void> {
    // 这里可以集成定时任务系统
    // 例如：每周运行一次智能遗忘处理
    console.log(`Scheduling memory maintenance for user ${userId}`);
    
    // 示例：使用 node-cron 或其他定时任务库
    // cron.schedule('0 0 * * 0', () => {
    //   this.processMemoryDecay(userId);
    // });
  }
}

export const intelligentForgettingSystem = new IntelligentForgettingSystem();