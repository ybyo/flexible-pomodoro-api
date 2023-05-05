import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IRes, IUser }     from '@/customTypes/interfaces/message.interface';
import { ChangeNameCmd }   from '@/users/application/command/impl/change-name.cmd';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';

@Injectable()
@CommandHandler(ChangeNameCmd)
export class ChangeNameHandler implements ICommandHandler<ChangeNameCmd> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
  ) {}

  async execute(command: ChangeNameCmd): Promise<IRes<IUser>> {
    const { email, newName } = command;

    const isDuplicate = await this.userRepository.findByUsername(newName);

    if (isDuplicate === null) {
      const user = await this.userRepository.findByEmail(email);

      if (user === null) {
        return {
          success: false,
          message: 'No user found with the matching email',
        };
      } else {
        try {
          await this.userRepository.updateUser(
            { email },
            { userName: newName },
          );
        } catch (err) {
          console.log(err);
          return {
            success: false,
            message: 'An error occurred while saving new username',
          };
        }
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: email,
          userName: newName,
        } as IUser,
        message: 'The username has been successfully set',
      };
    }

    return {
      success: false,
      message: 'Duplicate username',
    };
  }
}
