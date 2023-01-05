import { plainToClass } from 'class-transformer';

export class User {
  private _userId: string;
  private _userName: string;
  private _email: string;
  private _password: string;
  private _signupVerifyToken: string;
  private _refreshToken: string;
  private _resetPasswordToken: string;
  private _isVerified: boolean;
  private _isLoggedin: boolean;
  private _isActive: boolean;

  constructor(user: Partial<User>) {
    if (user) {
      Object.assign(
        this,
        plainToClass(User, user, {
          excludeExtraneousValues: false,
        }),
      );
    }
  }

  get userId(): Readonly<string> {
    return this._userId;
  }

  set userId(userId: string) {
    this._userId = userId;
  }

  get userName(): Readonly<string> {
    return this._userName;
  }

  set userName(userName: string) {
    this._userName = userName;
  }

  get email(): Readonly<string> {
    return this._email;
  }

  set email(email: string) {
    this._email = email;
  }

  get password(): Readonly<string> {
    return this._password;
  }

  set password(hashedPassword: string) {
    this._password = hashedPassword;
  }

  get signupVerifyToken(): Readonly<string> {
    return this._signupVerifyToken;
  }

  set signupVerifyToken(signupVerifyToken: string) {
    this._signupVerifyToken = signupVerifyToken;
  }

  get refreshToken(): Readonly<string> {
    return this._refreshToken;
  }

  set refreshToken(refreshToken: string) {
    this._refreshToken = refreshToken;
  }

  get resetPasswordToken(): Readonly<string> {
    return this._resetPasswordToken;
  }

  set resetPasswordToken(resetPasswordToken: string) {
    this._resetPasswordToken = resetPasswordToken;
  }

  get isVerified(): Readonly<boolean> {
    return this._isVerified;
  }

  set isVerified(isVerified: boolean) {
    this._isVerified = isVerified;
  }

  get isLoggedin(): Readonly<boolean> {
    return this._isLoggedin;
  }

  set isLoggedin(isLoggedin: boolean) {
    this._isLoggedin = isLoggedin;
  }

  get isActive(): Readonly<boolean> {
    return this._isActive;
  }

  set isActive(isActive: boolean) {
    this._isActive = isActive;
  }
}
