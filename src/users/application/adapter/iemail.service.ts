export interface IEmailService {
  sendTokenEmail: (event, email, token) => Promise<void>;
}
