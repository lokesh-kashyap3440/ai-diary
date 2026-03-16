import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class UpdateEntryTagsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags!: string[];
}
