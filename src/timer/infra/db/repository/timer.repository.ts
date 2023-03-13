import { StacksToTimerEntity } from '@/stacks/infra/db/entity/stacks-to-timer.entity';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { ITimerRepository } from '@/timer/domain/itimer.repository';
import { Timer } from '@/timer/domain/timer.model';
import { TimerEntity } from '@/timer/infra/db/entity/timer.entity';
import { IRes } from '@/type-defs/message.interface';
import { entityFormatter } from '@/utils/entity-formatter.util';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TimerRepository implements ITimerRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private connection: DataSource,
    @InjectRepository(TimerEntity)
    private timerRepository: Repository<TimerEntity>,
    @InjectRepository(StacksToTimerEntity)
    private stacksToTimerRepository: Repository<StacksToTimerEntity>,
    @InjectRepository(StacksEntity)
    private stacksRepository: Repository<StacksEntity>,
  ) {}
  async fetchTimer(id: string): Promise<Timer[]> {
    const timerEntity = await this.timerRepository.find({
      // relations: ['user'],
      where: { userId: id },
      loadRelationIds: false,
    });

    if (!timerEntity) {
      return null;
    }

    return this.mapper.mapArray(timerEntity, TimerEntity, Timer);
  }

  async saveTimer(userId: string, timer: Timer[]): Promise<IRes<void>> {
    try {
      await this.connection.transaction(async (manager) => {
        // ID 필터링 기준 = 'timerId'
        const { formatResult, ids } = entityFormatter(timer, '_', {
          userId: userId,
        });

        const entity = TimerEntity.create(formatResult);

        const data = await this.timerRepository.find({
          select: ['timerId'],
          where: { userId },
          loadRelationIds: false,
        });

        // 현재 사용자의 Timer 인벤토리에 저장된 Timer만을 반영
        const dataToRemove = data.filter(
          (timer) => !ids.includes(timer.timerId),
        );

        if (dataToRemove.length > 0) {
          const stackIds: Set<string> = new Set();

          // 스택 아이디 추출
          for (const timer of dataToRemove) {
            const stacksToTimerEntities =
              await this.stacksToTimerRepository.find({
                where: { timerId: timer.timerId },
                relations: ['stacks'],
              });
            const stackId = stacksToTimerEntities.map(
              (entry) => entry.stacks.id,
            );
            stackIds.add(stackId[0]);
          }

          await this.stacksToTimerRepository
            .createQueryBuilder()
            .delete()
            .where('timerId IN (:...timerIds)', {
              timerIds: dataToRemove.map((f) => f.timerId),
            })
            .execute();

          // 만약 타이머 제거 후 스택에 남아있는 타이머가 없다면 스택도 함께 제거
          for (const stackId of stackIds) {
            // TODO: 찾는 메서드 find로 일치시키기
            const entries = await this.stacksToTimerRepository.findBy({
              stacksId: stackId,
            });
            if (entries.length === 0) {
              try {
                console.log(stackId);
                await this.stacksRepository.delete({ id: stackId });
              } catch (err) {
                console.log(err);
              }
            }
          }
        }

        await manager.remove(dataToRemove);
        await manager.save(entity);
      });
    } catch (err) {
      throw new Error(err);
    }

    const result = {} as IRes<void>;

    result.success = true;

    return result;
  }
}
