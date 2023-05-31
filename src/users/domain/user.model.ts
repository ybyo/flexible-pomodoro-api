import { MapperOmitType } from '@automapper/classes/mapped-types';

import { AUserJwt } from '@/shared/abstracts/generate-user-jwt.base';

export class User extends AUserJwt {
  id: string;
  email: string;
  username: string;
  password: string;
  newEmail: string;
  signupToken: string;
  changePasswordToken: string;
  changeEmailToken: string;
}

export class UserWithoutPassword extends MapperOmitType(User, ['password']) {}

export class UserJwt extends AUserJwt {
  id: string;
  email: string;
  username: string;
}
