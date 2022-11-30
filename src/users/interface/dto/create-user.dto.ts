import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotIn } from 'src/utils/decorators/not-in';

export class CreateUserDto {
  @Transform((params) => params.value.trim())
  @NotIn('password', {
    message: 'The name string is included in the password.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  readonly name: string;

  @Transform(({ value, obj }) => {
    if (obj.password.includes(value.trim())) {
      throw new BadRequestException(
        'The name string is included in the password.',
      );
    }
    return value.trim();
  })
  @IsString()
  @IsEmail()
  @MaxLength(128)
  readonly email: string;

  @IsString()
  @Matches(/^[A-Za-z\d!@#$%^&*()]{8,128}$/)
  readonly password: string;
}
