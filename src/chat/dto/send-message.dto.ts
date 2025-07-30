import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsArray()
  @IsOptional()
  documentNames?: string[];

  @IsString()
  @IsOptional()
  userId?: string; // Optional user identification
}
