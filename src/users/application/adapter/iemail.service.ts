export interface IEmailService {
  sendUserSignupVerification: (email, signupVerifyToken) => Promise<void>;
}
