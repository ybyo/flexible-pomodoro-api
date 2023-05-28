import { Injectable } from '@nestjs/common';

import { UserWithoutPassword } from '@/users/domain/user.model';

@Injectable()
export class UserFactory {
  create(
    uid: string,
    username: string,
    email: string,
    password: string,
    signupToken: string,
    changePasswordToken: string,
    changeEmailToken: string,
  ): UserWithoutPassword {
    const user = new UserWithoutPassword();
    user.uid = uid;
    user.username = username;
    user.email = email;
    user.signupToken = signupToken;
    user.changePasswordToken = changePasswordToken;
    user.changeEmailToken = changeEmailToken;

    return user;
  }
}
