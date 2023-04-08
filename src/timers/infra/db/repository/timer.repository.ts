import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { ITimerRepository } from '@/timers/domain/itimer.repository';
import { Timer } from '@/timers/domain/timer.model';
import { TimerEntity } from '@/timers/infra/db/entity/timer.entity';
import { entityFormatter } from '@/utils/entity-formatter.util';

@Injectable()
export class TimerRepository implements ITimerRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private connection: DataSource,
    @InjectRepository(TimerEntity)
    private timerRepository: Repository<TimerEntity>,
    @InjectRepository(RoutineToTimerEntity)
    private routineToTimerRepository: Repository<RoutineToTimerEntity>,
    @InjectRepository(RoutineEntity)
    private routineRepository: Repository<RoutineEntity>,
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
          const routineIds: Set<string> = new Set();

          // 스택 아이디 추출
          for (const timer of dataToRemove) {
            const routineToTimerEntities =
              await this.routineToTimerRepository.find({
                where: { timerId: timer.timerId },
                relations: ['routine'],
              });
            const routineId = routineToTimerEntities.map(
              (entry) => entry.routine.id,
            );
            routineIds.add(routineId[0]);
          }

          await this.routineToTimerRepository
            .createQueryBuilder()
            .delete()
            .where('timerId IN (:...timerIds)', {
              timerIds: dataToRemove.map((f) => f.timerId),
            })
            .execute();

          // 만약 타이머 제거 후 스택에 남아있는 타이머가 없다면 스택도 함께 제거
          for (const routineId of routineIds) {
            // TODO: 찾는 메서드 find로 일치시키기
            const entries = await this.routineToTimerRepository.findBy({
              routineId: routineId,
            });
            if (entries.length === 0) {
              try {
                console.log(routineId);
                await this.routineRepository.delete({ id: routineId });
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
