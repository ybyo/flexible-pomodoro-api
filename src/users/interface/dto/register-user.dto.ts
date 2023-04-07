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
import { MatchPassword } from '@/utils/decorators/match-password.decorator';

export class RegisterUserDto {
  @Transform(({ value, obj }) => {
    if (obj.password.includes(value.trim())) {
      throw new BadRequestException(
        'The email string is included in the password.',
      );
    }
    return value.trim();
  })
  @IsString()
  @IsEmail()
  @MaxLength(320)
  readonly email: string;

  @Transform((params) => params.value.trim())
  @NotIn('password', {
    message: 'The name string is included in the password.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(39)
  readonly userName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^.{8,32}$/)
  readonly password: string;

  // TODO: Test 추가
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @MatchPassword('password', { message: 'Password does not match.' })
  passwordConfirm: string;
}
