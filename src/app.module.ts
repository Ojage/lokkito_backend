import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortsModule } from './shorts/shorts.module';
import { TranslateModule } from './translate/translate.module';
import { AudioController } from './audio/audio.controller';
import { AudioService } from './audio/audio.service';
import { AudioModule } from './audio/audio.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { OpenaiModule } from './openai_lokkito/openai_lokkito.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: configService.get<string>('MONGODB_DATABASE'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ShortsModule,
    TranslateModule,
    AudioModule,
    AuthModule,
    ChatModule,
    OpenaiModule,
  ],
  controllers: [AppController, AudioController],
  providers: [AppService, AudioService],
})
export class AppModule {}
