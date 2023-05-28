import { MapperOmitType } from '@automapper/classes/mapped-types';

import { AUserJwt } from '@/shared/abstracts/generate-user-jwt.base';

export class User extends AUserJwt {
  uid: string;
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
  uid: string;
  email: string;
  username: string;
}
