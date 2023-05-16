import { ACommonResponseDto } from '@/shared/abstract/common-response.base';
import { UserWithoutPassword } from '@/users/domain/user.model';

export class UserResponseDto extends ACommonResponseDto {
  success: boolean;
  data?: UserWithoutPassword;
}
