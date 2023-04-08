import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import * as filter from 'leo-profanity';

export class ChangeUsernameDto {
  @Transform(({ value }) => {
    if (filter.check(value.trim())) {
      throw new BadRequestException('Contains some prohibited words');
    }
    return value.trim();
  })
  @IsString()
  @MinLength(3)
  @MaxLength(39)
  @Matches(/^[A-Za-z0-9]+$/)
  readonly newName: string;
}
