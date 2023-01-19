import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotIn } from '@/utils/decorators/not-in.decorator';

// TODO: 닉네임에 특수 문자 사용 금지 등 규칙 추가
export class RegisterUserDto {
  @Transform((params) => params.value.trim())
  @NotIn('password', {
    message: 'The name string is included in the password.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  readonly userName: string;

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
