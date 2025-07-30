import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenaiModule } from 'src/openai_lokkito/openai_lokkito.module';
import { Chat, ChatSchema } from './chat.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    OpenaiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
