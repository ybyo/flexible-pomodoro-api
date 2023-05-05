import { IRes } from '@/customTypes/interfaces/message.interface';

export interface IEmailService {
  sendTokenEmail: (event, email, token) => Promise<IRes>;
}
