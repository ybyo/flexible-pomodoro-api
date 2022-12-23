export class User {
  constructor(
    private id: string,
    private name: string,
    private email: string,
    private password: string,
    private signupVerifyToken: string,
    private isVerified?: boolean,
    private isLoggedin?: boolean,
    private isActive?: boolean,
  ) {}

  getId(): Readonly<string> {
    return this.id;
  }

  getName(): Readonly<string> {
    return this.name;
  }

  getEmail(): Readonly<string> {
    return this.email;
  }

  getPassword(): Readonly<string> {
    return this.password;
  }

  getToken(): Readonly<string> {
    return this.signupVerifyToken;
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
