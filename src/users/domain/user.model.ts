import { plainToClass } from 'class-transformer';

export class User {
  id: string;
  userName: string;
  email: string;
  password: string;
  signupToken: string;
  refreshToken: string;
  resetPasswordToken: string;

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

  // get id(): Readonly<string> {
  //   return this._id;
  // }
  //
  // set id(id: string) {
  //   this._id = id;
  // }
  //
  // get userName(): Readonly<string> {
  //   return this._userName;
  // }
  //
  // set userName(userName: string) {
  //   this._userName = userName;
  // }
  //
  // get email(): Readonly<string> {
  //   return this._email;
  // }
  //
  // set email(email: string) {
  //   this._email = email;
  // }
  //
  // get password(): Readonly<string> {
  //   return this._password;
  // }
  //
  // set password(hashedPassword: string) {
  //   this._password = hashedPassword;
  // }
  //
  // get signupToken(): Readonly<string> {
  //   return this._SignupToken;
  // }
  //
  // set signupToken(signupToken: string) {
  //   this._SignupToken = signupToken;
  // }
  //
  // get refreshToken(): Readonly<string> {
  //   return this._refreshToken;
  // }
  //
  // set refreshToken(refreshToken: string) {
  //   this._refreshToken = refreshToken;
  // }
  //
  // get resetPasswordToken(): Readonly<string> {
  //   return this._resetPasswordToken;
  // }
  //
  // set resetPasswordToken(resetPasswordToken: string) {
  //   this._resetPasswordToken = resetPasswordToken;
  // }
  //
  // get isVerified(): Readonly<boolean> {
  //   return this._isVerified;
  // }
  //
  // set isVerified(isVerified: boolean) {
  //   this._isVerified = isVerified;
  // }
  //
  // get isLoggedin(): Readonly<boolean> {
  //   return this._isLoggedin;
  // }
  //
  // set isLoggedin(isLoggedin: boolean) {
  //   this._isLoggedin = isLoggedin;
  // }
  //
  // get isActive(): Readonly<boolean> {
  //   return this._isActive;
  // }
  //
  // set isActive(isActive: boolean) {
  //   this._isActive = isActive;
  // }
}
