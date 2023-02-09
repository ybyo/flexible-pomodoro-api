import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CheckEmailDto {
  @IsString()
  @IsEmail()
  @MaxLength(320)
  readonly email: string;
}
