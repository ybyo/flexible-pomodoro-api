import { Injectable } from '@nestjs/common';

import { UserWithoutPassword } from '@/users/domain/user.model';

@Injectable()
export class UserFactory {
  create(
    id: string,
    name: string,
    email: string,
    password: string,
    signupToken: string,
    changePasswordToken: string,
    changeEmailToken: string,
  ): UserWithoutPassword {
    const user = new UserWithoutPassword();

    user.id = id;
    user.name = name;
    user.email = email;
    user.signupToken = signupToken;
    user.changePasswordToken = changePasswordToken;
    user.changeEmailToken = changeEmailToken;

    return user;
  }
}
