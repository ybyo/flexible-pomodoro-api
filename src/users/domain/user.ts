import { Expose, plainToClass } from 'class-transformer';
import { UserTypeInterface } from '@/users/domain/user-type.interface';

export class User implements UserTypeInterface {
  @Expose()
  uid: string;
  @Expose()
  userName: string;
  @Expose()
  email: string;
  @Expose()
  password: string;
  @Expose()
  signupVerifyToken: string;
  @Expose()
  refreshToken: string;
  @Expose()
  resetPasswordToken: string;
  @Expose()
  isVerified: boolean;
  @Expose()
  isLoggedin: boolean;
  @Expose()
  isActive: boolean;

  constructor(user: Partial<User>) {
    if (user) {
      Object.assign(
        this,
        plainToClass(User, user, {
          excludeExtraneousValues: true,
        }),
      );
    }
  }

  getUid(): Readonly<string> {
    return this.uid;
  }

  getUserName(): Readonly<string> {
    return this.userName;
  }

  getEmail(): Readonly<string> {
    return this.email;
  }

  getPassword(): Readonly<string> {
    return this.password;
  }

  setPassword(hashedPassword: string) {
    this.password = hashedPassword;
  }

  getToken(): Readonly<string> {
    return this.signupVerifyToken;
  }

  getRefreshToken(): Readonly<string> {
    return this.refreshToken;
  }

  getResetPasswordToken(): Readonly<string> {
    return this.resetPasswordToken;
  }

  getIsVerified(): Readonly<boolean> {
    return this.isVerified;
  }

  getIsLoggedin(): Readonly<boolean> {
    return this.isLoggedin;
  }

  getIsActive(): Readonly<boolean> {
    return this.isActive;
  }
}
