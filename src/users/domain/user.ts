import { plainToClass } from 'class-transformer';

export class User {
  readonly userId: string;
  readonly userName: string;
  readonly email: string;
  password: string;
  readonly signupVerifyToken: string;
  readonly refreshToken: string;
  readonly resetPasswordToken: string;
  readonly isVerified: boolean;
  readonly isLoggedin: boolean;
  readonly isActive: boolean;

  constructor(protected user: Partial<User>) {
    if (user) {
      Object.assign(
        this,
        plainToClass(User, user, {
          excludeExtraneousValues: false,
        }),
      );
    }
  }

  getUserId(): Readonly<string> {
    return this.userId;
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
