export interface IEmailService {
  sendUserSignupVerification: (email, signupToken) => Promise<void>;
  sendResetPasswordToken: (email, resetPasswordToken) => Promise<void>;
  sendChangeEmailVerification: (email, changeEmailVerifyToken) => Promise<void>;
}
