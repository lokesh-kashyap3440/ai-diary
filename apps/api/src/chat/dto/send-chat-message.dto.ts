import { IsOptional, IsString, MaxLength } from "class-validator";

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  threadId?: string;

  @IsString()
  @MaxLength(3000)
  message!: string;

  @IsOptional()
  @IsString()
  relatedEntryId?: string;
}
