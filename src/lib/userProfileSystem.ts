import { PrismaClient, MemoryType } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
  languageStyle: 'verbose' | 'concise' | 'detailed' | 'simple';
  preferredTopics: string[];
  knowledgeAreas: string[];
}

export interface BehaviorAnalysis {
  avgSessionLength: number;
  totalSessions: number;
  mostActiveHours: string[];
  responsePatterns: Record<string, number>;
  topicInterests: Record<string, number>;
}

export interface LearningPattern {
  learningStyle: string;
  retentionRate: number;
  preferredExplanationTypes: string[];
  questionPatterns: string[];
}

export class UserProfileSystem {
  async initializeUserProfile(userId: number): Promise<void> {
    try {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (!existingProfile) {
        await prisma.userProfile.create({
          data: {
            userId,
            communicationStyle: 'casual',
            preferredTopics: [],
            languageStyle: 'concise',
            avgSessionLength: 0,
            totalSessions: 0,
            mostActiveHours: [],
            learningPatterns: {},
            knowledgeAreas: [],
          }
        });
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  async analyzeUserMessage(
    userId: number,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      const [sentiment, topics, communicationStyle] = await Promise.all([
        this.analyzeSentiment(messageContent),
        this.extractTopics(messageContent),
        this.detectCommunicationStyle(messageContent)
      ]);

      await this.updateUserPreferences(userId, {
        topics,
        sentiment,
        communicationStyle,
        messageLength: messageContent.length,
        timestamp: new Date()
      });

      await this.storePreferenceMemory(userId, conversationId, {
        content: messageContent,
        topics,
        sentiment,
        communicationStyle
      });
    } catch (error) {
      console.error('Error analyzing user message:', error);
    }
  }

  private async analyzeSentiment(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of this text and return one word: positive, negative, or neutral:\n\n${text}`
        }],
        max_tokens: 10,
        temperature: 0.1,
      });
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral';
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'neutral';
    }
  }

  private async extractTopics(text: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Extract 3-5 main topics from this text. Return only topic names separated by commas:\n\n${text}`
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

  private async detectCommunicationStyle(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Analyze the communication style of this text and return one word: formal, casual, technical, or friendly:\n\n${text}`
        }],
        max_tokens: 10,
        temperature: 0.1,
      });
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'casual';
    } catch (error) {
      console.error('Error detecting communication style:', error);
      return 'casual';
    }
  }

  private async updateUserPreferences(
    userId: number,
    analysis: {
      topics: string[];
      sentiment: string;
      communicationStyle: string;
      messageLength: number;
      timestamp: Date;
    }
  ): Promise<void> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        await this.initializeUserProfile(userId);
        return;
      }

      const updatedTopics = this.mergeTopics(profile.preferredTopics, analysis.topics);
      const currentHour = analysis.timestamp.getHours().toString();
      const updatedActiveHours = this.updateActiveHours(profile.mostActiveHours, currentHour);
      
      const learningPatterns = profile.learningPatterns as any || {};
      const updatedLearningPatterns = {
        ...learningPatterns,
        recentTopics: analysis.topics,
        recentSentiment: analysis.sentiment,
        avgMessageLength: this.calculateAvgMessageLength(
          learningPatterns.avgMessageLength || 0,
          analysis.messageLength,
          learningPatterns.messageCount || 0
        )
      };

      await prisma.userProfile.update({
        where: { userId },
        data: {
          preferredTopics: updatedTopics,
          communicationStyle: analysis.communicationStyle,
          mostActiveHours: updatedActiveHours,
          learningPatterns: updatedLearningPatterns,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  private mergeTopics(existingTopics: string[], newTopics: string[]): string[] {
    const topicCounts: Record<string, number> = {};
    
    existingTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    newTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 2; // 新话题权重更高
    });

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([topic]) => topic);
  }

  private updateActiveHours(existingHours: string[], newHour: string): string[] {
    const hourCounts: Record<string, number> = {};
    
    existingHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    hourCounts[newHour] = (hourCounts[newHour] || 0) + 1;

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([hour]) => hour);
  }

  private calculateAvgMessageLength(
    currentAvg: number,
    newLength: number,
    count: number
  ): number {
    return (currentAvg * count + newLength) / (count + 1);
  }

  private async storePreferenceMemory(
    userId: number,
    conversationId: string,
    data: {
      content: string;
      topics: string[];
      sentiment: string;
      communicationStyle: string;
    }
  ): Promise<void> {
    try {
      await prisma.memoryEntry.create({
        data: {
          userId,
          conversationId,
          type: MemoryType.PREFERENCE,
          title: `User preference from ${new Date().toLocaleDateString()}`,
          content: JSON.stringify({
            communicationStyle: data.communicationStyle,
            sentiment: data.sentiment,
            topics: data.topics,
            originalContent: data.content.substring(0, 200)
          }),
          context: `Conversation preferences analysis`,
          importanceScore: this.calculatePreferenceImportance(data),
          tags: [...data.topics, data.sentiment, data.communicationStyle],
          relatedTopics: data.topics,
        }
      });
    } catch (error) {
      console.error('Error storing preference memory:', error);
    }
  }

  private calculatePreferenceImportance(data: {
    topics: string[];
    sentiment: string;
    communicationStyle: string;
  }): number {
    let score = 5; // 基础分数
    
    if (data.topics.length > 3) score += 2;
    if (data.sentiment !== 'neutral') score += 1;
    if (['technical', 'formal'].includes(data.communicationStyle)) score += 1;
    
    return Math.min(score, 10);
  }

  async getUserPersonalization(userId: number): Promise<{
    preferences: UserPreferences | null;
    behavior: BehaviorAnalysis | null;
    learningPatterns: LearningPattern | null;
    recentMemories: any[];
  }> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      const recentMemories = await prisma.memoryEntry.findMany({
        where: {
          userId,
          type: MemoryType.PREFERENCE,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (!profile) {
        return {
          preferences: null,
          behavior: null,
          learningPatterns: null,
          recentMemories: []
        };
      }

      const preferences: UserPreferences = {
        communicationStyle: profile.communicationStyle as any || 'casual',
        languageStyle: profile.languageStyle as any || 'concise',
        preferredTopics: profile.preferredTopics,
        knowledgeAreas: profile.knowledgeAreas,
      };

      const behavior: BehaviorAnalysis = {
        avgSessionLength: profile.avgSessionLength,
        totalSessions: profile.totalSessions,
        mostActiveHours: profile.mostActiveHours,
        responsePatterns: {},
        topicInterests: this.calculateTopicInterests(profile.preferredTopics),
      };

      const learningPatterns: LearningPattern = {
        learningStyle: (profile.learningPatterns as any)?.learningStyle || 'visual',
        retentionRate: (profile.learningPatterns as any)?.retentionRate || 0.7,
        preferredExplanationTypes: (profile.learningPatterns as any)?.preferredExplanationTypes || ['example', 'step-by-step'],
        questionPatterns: (profile.learningPatterns as any)?.questionPatterns || [],
      };

      return {
        preferences,
        behavior,
        learningPatterns,
        recentMemories
      };
    } catch (error) {
      console.error('Error getting user personalization:', error);
      return {
        preferences: null,
        behavior: null,
        learningPatterns: null,
        recentMemories: []
      };
    }
  }

  private calculateTopicInterests(topics: string[]): Record<string, number> {
    const interests: Record<string, number> = {};
    topics.forEach((topic, index) => {
      interests[topic] = Math.max(0.1, 1 - (index * 0.05));
    });
    return interests;
  }

  async updateSessionStats(userId: number, sessionLength: number): Promise<void> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (profile) {
        const newTotalSessions = profile.totalSessions + 1;
        const newAvgLength = (profile.avgSessionLength * profile.totalSessions + sessionLength) / newTotalSessions;

        await prisma.userProfile.update({
          where: { userId },
          data: {
            avgSessionLength: Math.round(newAvgLength),
            totalSessions: newTotalSessions,
            updatedAt: new Date(),
          }
        });
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  async generatePersonalizedResponse(
    originalResponse: string,
    userPersonalization: { preferences: UserPreferences | null }
  ): Promise<string> {
    if (!userPersonalization.preferences) {
      return originalResponse;
    }

    try {
      const { communicationStyle, languageStyle, preferredTopics } = userPersonalization.preferences;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Adapt this response to match the user's preferences:
          
Communication Style: ${communicationStyle}
Language Style: ${languageStyle}
Preferred Topics: ${preferredTopics.join(', ')}

Original Response:
${originalResponse}

Return the adapted response that matches the user's style while maintaining the same information.`
        }],
        max_tokens: 1000,
        temperature: 0.3,
      });
      
      return response.choices[0]?.message?.content || originalResponse;
    } catch (error) {
      console.error('Error generating personalized response:', error);
      return originalResponse;
    }
  }
}

export const userProfileSystem = new UserProfileSystem();