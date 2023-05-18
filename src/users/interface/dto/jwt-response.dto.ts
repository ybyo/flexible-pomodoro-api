import { ACommonResponseDto } from '@/shared/abstracts/common-response.base';
import { UserJwt } from '@/users/domain/user.model';

export class JwtResponseDto extends ACommonResponseDto {
  success: boolean;
  data?: UserJwt;
}
