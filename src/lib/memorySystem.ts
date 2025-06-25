import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SemanticSearchResult {
  id: string;
  content: string;
  summary: string;
  similarity: number;
  importanceScore: number;
  lastAccessed: Date;
}

export interface MemoryContext {
  userId: number;
  conversationId?: string;
  messageId?: string;
  currentTopic?: string;
}

export class SemanticMemorySystem {
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_RESULTS = 10;

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract 5-10 key terms and concepts from the following text. Return only the keywords separated by commas:\n\n${text}`
        }],
        max_tokens: 100,
        temperature: 0.3,
      });
      
      const keywords = response.choices[0]?.message?.content
        ?.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0) || [];
      
      return keywords;
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async extractEntities(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract named entities (people, places, organizations, dates, etc.) from the following text. Return only the entities separated by commas:\n\n${text}`
        }],
        max_tokens: 100,
        temperature: 0.3,
      });
      
      const entities = response.choices[0]?.message?.content
        ?.split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0) || [];
      
      return entities;
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Summarize the following text in 1-2 sentences, focusing on the key information:\n\n${text}`
        }],
        max_tokens: 150,
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content || text.substring(0, 200) + '...';
    } catch (error) {
      console.error('Error generating summary:', error);
      return text.substring(0, 200) + '...';
    }
  }

  async storeSemanticMemory(
    content: string,
    context: MemoryContext,
    importanceScore: number = 0
  ): Promise<string> {
    try {
      const [embedding, keywords, entities, summary] = await Promise.all([
        this.createEmbedding(content),
        this.extractKeywords(content),
        this.extractEntities(content),
        this.generateSummary(content)
      ]);

      const memory = await prisma.semanticMemory.create({
        data: {
          userId: context.userId,
          conversationId: context.conversationId,
          messageId: context.messageId,
          content,
          summary,
          keywords,
          entities,
          embedding,
          embeddingModel: this.EMBEDDING_MODEL,
          importanceScore,
          category: await this.categorizeContent(content),
          tags: [...keywords, ...entities].slice(0, 10),
        }
      });

      return memory.id;
    } catch (error) {
      console.error('Error storing semantic memory:', error);
      throw error;
    }
  }

  private async categorizeContent(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Categorize the following content into one of these categories: knowledge, personal, task, question, preference, fact, opinion, experience. Return only the category name:\n\n${content}`
        }],
        max_tokens: 10,
        temperature: 0.1,
      });
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'general';
    } catch (error) {
      console.error('Error categorizing content:', error);
      return 'general';
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += (a[i] || 0) * (b[i] || 0);
      normA += (a[i] || 0) * (a[i] || 0);
      normB += (b[i] || 0) * (b[i] || 0);
    }
    
    const norm = Math.sqrt(normA) * Math.sqrt(normB);
    return norm === 0 ? 0 : dotProduct / norm;
  }

  async searchSemanticMemory(
    query: string,
    userId: number,
    limit: number = this.MAX_RESULTS
  ): Promise<SemanticSearchResult[]> {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      
      const memories = await prisma.semanticMemory.findMany({
        where: { userId },
        select: {
          id: true,
          content: true,
          summary: true,
          embedding: true,
          importanceScore: true,
          lastAccessed: true,
          keywords: true,
          tags: true,
        }
      });

      const results: SemanticSearchResult[] = memories
        .map(memory => ({
          ...memory,
          similarity: this.calculateCosineSimilarity(queryEmbedding, memory.embedding)
        }))
        .filter(result => result.similarity >= this.SIMILARITY_THRESHOLD)
        .sort((a, b) => {
          const scoreA = a.similarity * 0.7 + a.importanceScore * 0.3;
          const scoreB = b.similarity * 0.7 + b.importanceScore * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      await this.updateAccessStats(results.map(r => r.id));

      return results;
    } catch (error) {
      console.error('Error searching semantic memory:', error);
      return [];
    }
  }

  private async updateAccessStats(memoryIds: string[]): Promise<void> {
    try {
      await prisma.semanticMemory.updateMany({
        where: { id: { in: memoryIds } },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        }
      });
    } catch (error) {
      console.error('Error updating access stats:', error);
    }
  }

  async findRelatedMemories(
    memoryId: string,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    try {
      const memory = await prisma.semanticMemory.findUnique({
        where: { id: memoryId },
        select: { embedding: true, userId: true, keywords: true, tags: true }
      });

      if (!memory) return [];

      return await this.searchSemanticMemory(
        memory.keywords.concat(memory.tags).join(' '),
        memory.userId,
        limit + 1
      ).then(results => results.filter(r => r.id !== memoryId));
    } catch (error) {
      console.error('Error finding related memories:', error);
      return [];
    }
  }

  async createMemoryRelation(
    fromMemoryId: string,
    toMemoryId: string,
    relationType: string,
    strength: number = 1.0
  ): Promise<void> {
    try {
      await prisma.memoryRelation.create({
        data: {
          fromMemoryId,
          toMemoryId,
          relationType,
          strength,
        }
      });
    } catch (error) {
      console.error('Error creating memory relation:', error);
    }
  }

  async getMemoryContext(userId: number, conversationId?: string): Promise<SemanticSearchResult[]> {
    try {
      const recentMemories = await prisma.semanticMemory.findMany({
        where: {
          userId,
          ...(conversationId && { conversationId }),
          lastAccessed: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        },
        orderBy: [
          { importanceScore: 'desc' },
          { lastAccessed: 'desc' }
        ],
        take: 5,
        select: {
          id: true,
          content: true,
          summary: true,
          importanceScore: true,
          lastAccessed: true,
        }
      });

      return recentMemories.map(memory => ({
        ...memory,
        similarity: 1.0 // 上下文记忆不需要相似度计算
      }));
    } catch (error) {
      console.error('Error getting memory context:', error);
      return [];
    }
  }
}

export const semanticMemorySystem = new SemanticMemorySystem();