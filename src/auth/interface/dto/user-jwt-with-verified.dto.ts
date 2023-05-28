import { AUserJwt } from '@/shared/abstracts/generate-user-jwt.base';

export class UserJwtWithVerifiedDto extends AUserJwt {
  uid: string;
  email: string;
  username: string;
  isVerified: boolean;
}
