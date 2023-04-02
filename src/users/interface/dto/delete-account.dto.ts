import { BadRequestException } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteAccountDto {
  @Transform(({ value }) => {
    if (value.trim() !== 'Delete account') {
      throw new BadRequestException('Wrong input value');
    }
    return value.trim();
  })
  @IsString()
  @Matches(/^[A-Za-z\s]+$/)
  readonly validation: string;
}
