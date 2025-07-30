import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenaiService } from '../openai_lokkito/openai_lokkito.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Chat, ChatDocument, ChatMessage } from './chat.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async processMessage({
    message,
    chatId,
    documentNames,
    userId,
  }: SendMessageDto) {
    try {
      // Get or create chat history
      let chat = await this.getChatHistory(chatId);

      if (!chat) {
        chat = await this.createNewChat(chatId, documentNames, userId);
      } else {
        // Update document names if provided
        if (documentNames?.length) {
          chat.documentNames = [
            ...new Set([...chat.documentNames, ...documentNames]),
          ];
        }
      }

      // Add user message to history
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      chat.messages.push(userMessage);

      // Build context from chat history and documents
      const context = this.buildContext(chat.messages, chat.documentNames);

      // Prepare messages for OpenAI (last 10 messages to avoid token limits)
      const recentMessages = chat.messages.slice(-10).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Add system context
      const messagesWithContext = [
        {
          role: 'system' as const,
          content: context,
        },
        ...recentMessages,
      ];

      // Get AI response
      const aiResponse =
        await this.openaiService.sendMessages(messagesWithContext);

      // Add AI response to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
      };

      chat.messages.push(assistantMessage);
      chat.lastActivity = new Date();

      // Save updated chat
      await chat.save();

      this.logger.log(`Processed message for chat ${chatId}`);

      return {
        response: aiResponse.response,
        chatId: chat.chatId,
        messageCount: chat.messages.length,
      };
    } catch (error) {
      this.logger.error(
        `Error processing message for chat ${chatId}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  async getChatHistory(chatId: string): Promise<ChatDocument | null> {
    try {
      return await this.chatModel.findOne({ chatId }).exec();
    } catch (error) {
      this.logger.error(
        `Error fetching chat history for ${chatId}: ${error.message}`,
      );
      throw new Error(`Failed to fetch chat history: ${error.message}`);
    }
  }

  async createNewChat(
    chatId: string,
    documentNames?: string[],
    userId?: string,
  ): Promise<ChatDocument> {
    try {
      const newChat = new this.chatModel({
        chatId,
        messages: [],
        documentNames: documentNames || [],
        userId,
        lastActivity: new Date(),
      });

      return await newChat.save();
    } catch (error) {
      this.logger.error(`Error creating new chat ${chatId}: ${error.message}`);
      throw new Error(`Failed to create new chat: ${error.message}`);
    }
  }

  async getAllChats(userId?: string): Promise<ChatDocument[]> {
    try {
      const filter = userId ? { userId } : {};
      return await this.chatModel
        .find(filter)
        .sort({ lastActivity: -1 })
        .select('chatId lastActivity messageCount documentNames')
        .exec();
    } catch (error) {
      this.logger.error(`Error fetching all chats: ${error.message}`);
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }
  }

  async deleteChat(chatId: string): Promise<boolean> {
    try {
      const result = await this.chatModel.deleteOne({ chatId }).exec();
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Error deleting chat ${chatId}: ${error.message}`);
      throw new Error(`Failed to delete chat: ${error.message}`);
    }
  }

  async clearChatHistory(chatId: string): Promise<boolean> {
    try {
      const chat = await this.chatModel.findOne({ chatId }).exec();
      if (chat) {
        chat.messages = [];
        chat.lastActivity = new Date();
        await chat.save();
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Error clearing chat history for ${chatId}: ${error.message}`,
      );
      throw new Error(`Failed to clear chat history: ${error.message}`);
    }
  }

  private buildContext(
    messages: ChatMessage[],
    documentNames: string[],
  ): string {
    const documentContext = documentNames?.length
      ? `Based on your uploaded documents: ${documentNames.join(', ')}.\n`
      : `No documents uploaded.\n`;

    const conversationContext =
      messages.length > 0
        ? `Continue this conversation naturally. Previous context is available in the message history.\n`
        : `This is the start of a new conversation.\n`;

    return `${documentContext}${conversationContext}Respond in Pidgin with useful insight. Be helpful and conversational.`;
  }

  // Additional utility methods
  async getChatStats(chatId: string) {
    try {
      const chat = await this.chatModel.findOne({ chatId }).exec();
      if (!chat) {
        return null;
      }

      return {
        chatId: chat.chatId,
        messageCount: chat.messages.length,
        documentCount: chat.documentNames.length,
        lastActivity: chat.lastActivity,
        createdAt: chat.createdAt || new Date(), // Fallback if not available
        updatedAt: chat.updatedAt || chat.lastActivity, // Fallback to lastActivity
      };
    } catch (error) {
      this.logger.error(
        `Error getting chat stats for ${chatId}: ${error.message}`,
      );
      throw new Error(`Failed to get chat stats: ${error.message}`);
    }
  }
}
