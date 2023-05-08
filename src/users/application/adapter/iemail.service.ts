import { IRes } from '@/customTypes/interfaces/message.interface';

export interface IEmailService {
  sendTokenMail: (event, email, token) => Promise<IRes>;
}
