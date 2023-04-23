export interface IEmailService {
  sendUserSignupVerification: (email, signupVerifyToken) => Promise<void>;
  sendResetPasswordToken: (email, resetPasswordVerifyToken) => Promise<void>;
  sendChangeEmailVerification: (email, changeEmailVerifyToken) => Promise<void>;
}
