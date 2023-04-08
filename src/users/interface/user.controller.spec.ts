import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Chance } from 'chance';
import * as jwt from 'jsonwebtoken';

import { VerifyEmailCommand } from '@/users/application/command/impl/verify-email.command';
import { UserController } from '@/users/interface/user.controller';

const chance = new Chance();

const payload = {
  id: chance.guid(),
  name: chance.name(),
};

const secretKey = chance.string({ length: 32 });

const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

describe('UserController', () => {
  let controller: UserController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: CommandBus, useValue: { execute: jest.fn() } }],
    }).compile();

    commandBus = moduleRef.get<CommandBus>(CommandBus);
    controller = moduleRef.get<UserController>(UserController);
  });

  describe('verifyEmail', () => {
    it('should execute VerifyEmailCommand', async () => {
      // Given
      const signupVerifyToken = token;
      const expectedCommand = new VerifyEmailCommand(signupVerifyToken);

      // When
      await controller.verifyEmail({ signupVerifyToken });

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });
  });
});
