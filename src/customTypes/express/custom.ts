export type User = {
  id: string;
  userName: string;
  email: string;
  password: string;
  signupVerifyToken: string;
  refreshToken: string;
  resetPasswordToken: string;
  isVerified: boolean;
  isLoggedin: boolean;
  isActive: boolean;
};
