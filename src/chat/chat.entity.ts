import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ collection: 'messages' })
export class ChatMessage {
  @Prop({ required: true })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ collection: 'chats', timestamps: true })
export class Chat {
  @Prop({ required: true, unique: true })
  chatId: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  @Prop({ type: [String], default: [] })
  documentNames: string[];

  @Prop({ default: Date.now })
  lastActivity: Date;

  @Prop()
  userId?: string; // Optional user identification

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
