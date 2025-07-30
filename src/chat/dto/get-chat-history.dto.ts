import { IsString, IsNotEmpty } from 'class-validator';

export class GetChatHistoryDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;
}
