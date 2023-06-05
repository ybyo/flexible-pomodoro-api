import * as Chance from 'chance';
import { ulid } from 'ulid';

import { UserWithoutPassword } from '@/users/domain/user.model';
import { RegisterUserDto } from '@/users/interface/dto/register-user.dto';

export class CreateRandomObject {
  private static chance = new Chance();

  static RandomUserWithoutPassword(): UserWithoutPassword {
    const user = new UserWithoutPassword();
    user.id = ulid();
    user.email = `${ulid().toLowerCase()}@example.com`;
    user.username = this.chance.string({
      alpha: true,
      numeric: true,
      symbols: false,
    });
    user.newEmail = '';
    user.changeEmailToken = ulid();
    user.signupToken = null;

    do {
      user.newEmail = this.chance.email();
    } while (user.newEmail === user.email);

    return user;
  }

  static RandomUserForSignup(): RegisterUserDto {
    const user = new RegisterUserDto();
    user.email = `${ulid().toLowerCase()}@example.com`;
    user.username = this.chance.string({
      alpha: true,
      numeric: true,
      symbols: false,
    });
    user.password = '';
    do {
      user.password = this.chance.string({ length: 20 });
    } while (user.username === user.password);

    user.confirmPassword = user.password;

    return user;
  }
}
