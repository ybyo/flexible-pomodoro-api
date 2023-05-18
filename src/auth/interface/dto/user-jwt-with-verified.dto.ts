import { AGenerateUserJwt } from '@/shared/abstracts/generate-user-jwt.base';

export class UserJwtWithVerifiedDto extends AGenerateUserJwt {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}
