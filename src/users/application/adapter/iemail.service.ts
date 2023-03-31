export interface IEmailService {
  sendUserSignupVerification: (email, signupVerifyToken) => Promise<void>;
  sendPasswordResetVerification: (
    email,
    resetPasswordVerifyToken,
  ) => Promise<void>;
  sendChangeEmailVerification: (email, changeEmailVerifyToken) => Promise<void>;
}
