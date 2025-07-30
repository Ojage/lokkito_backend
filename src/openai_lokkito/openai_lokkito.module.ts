import { Module } from '@nestjs/common';
import { OpenaiService } from './openai_lokkito.service';

@Module({
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
