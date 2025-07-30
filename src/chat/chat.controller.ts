import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() body: SendMessageDto) {
    try {
      this.logger.log(`Processing message for chat: ${body.chatId}`);
      return await this.chatService.processMessage(body);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to send message',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  async getAllChats(@Query('userId') userId?: string) {
    try {
      this.logger.log(
        `Fetching all chats${userId ? ` for user: ${userId}` : ''}`,
      );
      const chats = await this.chatService.getAllChats(userId);
      return chats;
    } catch (error) {
      this.logger.error(`Failed to fetch chats: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to fetch chats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/:chatId')
  async getChatHistory(@Param('chatId') chatId: string) {
    try {
      this.logger.log(`Fetching chat history for: ${chatId}`);
      const chat = await this.chatService.getChatHistory(chatId);

      if (!chat) {
        throw new HttpException(
          {
            message: 'Chat not found',
            error: `No chat found with ID: ${chatId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        chatId: chat.chatId,
        messages: chat.messages,
        documentNames: chat.documentNames,
        lastActivity: chat.lastActivity,
        userId: chat.userId,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to fetch chat history: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to fetch chat history',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/:chatId')
  async getChatStats(@Param('chatId') chatId: string) {
    try {
      this.logger.log(`Fetching stats for chat: ${chatId}`);
      const stats = await this.chatService.getChatStats(chatId);

      if (!stats) {
        throw new HttpException(
          {
            message: 'Chat not found',
            error: `No chat found with ID: ${chatId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return stats;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to fetch chat stats: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to fetch chat stats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':chatId')
  async deleteChat(@Param('chatId') chatId: string) {
    try {
      this.logger.log(`Deleting chat: ${chatId}`);
      const deleted = await this.chatService.deleteChat(chatId);

      if (!deleted) {
        throw new HttpException(
          {
            message: 'Chat not found',
            error: `No chat found with ID: ${chatId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Chat deleted successfully',
        chatId,
        deleted: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to delete chat: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to delete chat',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':chatId/clear')
  async clearChatHistory(@Param('chatId') chatId: string) {
    try {
      this.logger.log(`Clearing chat history for: ${chatId}`);
      const cleared = await this.chatService.clearChatHistory(chatId);

      if (!cleared) {
        throw new HttpException(
          {
            message: 'Chat not found',
            error: `No chat found with ID: ${chatId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Chat history cleared successfully',
        chatId,
        cleared: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to clear chat history: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to clear chat history',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create')
  async createNewChat(
    @Body() body: { chatId: string; documentNames?: string[]; userId?: string },
  ) {
    try {
      this.logger.log(`Creating new chat: ${body.chatId}`);
      const chat = await this.chatService.createNewChat(
        body.chatId,
        body.documentNames,
        body.userId,
      );

      return {
        message: 'Chat created successfully',
        chatId: chat.chatId,
        createdAt: chat.createdAt,
        documentNames: chat.documentNames,
        userId: chat.userId,
      };
    } catch (error) {
      this.logger.error(`Failed to create chat: ${error.message}`);
      throw new HttpException(
        {
          message: 'Failed to create chat',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
