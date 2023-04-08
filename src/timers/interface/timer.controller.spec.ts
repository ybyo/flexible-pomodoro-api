import { Timer } from '@/timers/domain/timer.model';
import { Chance } from 'chance';
import { CommandBus } from '@nestjs/cqrs';
import { GetTimerCommand } from '@/timers/application/command/impl/get-timer.command';
import { IUser } from '@/type-defs/message.interface';
import { NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { SaveTimerCommand } from '@/timers/application/command/impl/save-timer.command';
import { Test, TestingModule } from '@nestjs/testing';
import { TimerController } from './timer.controller';
import { ulid } from 'ulid';

const chance = new Chance();

const user: IUser = {
  id: ulid(),
  email: chance.email(),
  userName: chance.name(),
};

const timer: Timer = {
  timerId: ulid(),
  name: chance.name(),
  duration: chance.second(),
  count: 0,
  order: 0,
  color: chance.color(),
};

describe('TimerController', () => {
  let controller: TimerController;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TimerController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<TimerController>(TimerController);
    commandBus = moduleRef.get<CommandBus>(CommandBus);
  });

  describe('fetch', () => {
    it('should fetch user timer data', async () => {
      const commandResult = [timer];

      jest
        .spyOn(commandBus, 'execute')
        .mockImplementationOnce(async () => commandResult);

      const req = {} as Request;
      req.user = user;
      const result = await controller.fetch(req);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new GetTimerCommand(user.id),
      );
      expect(result).toBe(commandResult);
    });
  });

  describe('commit', () => {
    it('should save user timer data', async () => {
      const timerData = [timer];
      const commandResult = { message: 'Success' };

      jest
        .spyOn(commandBus, 'execute')
        .mockImplementationOnce(async () => commandResult);

      const req = {} as Request;
      req.user = user;
      const result = await controller.commit(req, timerData);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new SaveTimerCommand(user.id, timerData),
      );
      expect(result).toBe(commandResult);
    });
  });

  describe('handleNotFound', () => {
    it('should throw NotFoundException', async () => {
      expect(() => controller.handleNotFound()).toThrowError(NotFoundException);
    });
  });
});
