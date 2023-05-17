import { AGenerateUserJwt } from '@/shared/abstract/generate-user-jwt.base';

export class UserWithoutPassword extends AGenerateUserJwt {
  id: string;
  email: string;
  name: string;
  newEmail: string;
  signupToken: string;
  changePasswordToken: string;
  changeEmailToken: string;
}

export class User extends UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  password: string;
  newEmail: string;
  signupToken: string;
  changePasswordToken: string;
  changeEmailToken: string;
}

export class UserJwt extends AGenerateUserJwt {
  id: string;
  email: string;
  name: string;
}
