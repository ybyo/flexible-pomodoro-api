import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';
import { IFragRepository } from '@/frags/domain/ifrag.repository';
import { IRes } from '@/type-defs/message.interface';
import { entityFormatter } from '@/utils/entity-formatter.util';
import { StacksToFragEntity } from '@/stacks/infra/db/entity/stacks-to-frag.entity';

@Injectable()
export class FragRepository implements IFragRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private connection: DataSource,
    @InjectRepository(FragEntity)
    private fragRepository: Repository<FragEntity>,
    @InjectRepository(StacksToFragEntity)
    private stacksToFragRepository: Repository<StacksToFragEntity>,
    @InjectRepository(StacksEntity)
    private stacksRepository: Repository<StacksEntity>,
  ) {}
  async fetchFrag(id: string): Promise<Frag[]> {
    const fragEntity = await this.fragRepository.find({
      // relations: ['user'],
      where: { userId: id },
      loadRelationIds: false,
    });

    if (!fragEntity) {
      return null;
    }

    const frags = this.mapper.mapArray(fragEntity, FragEntity, Frag);

    return frags;
  }

  async saveFrag(userId: string, frags: Frag[]): Promise<IRes<void>> {
    try {
      await this.connection.transaction(async (manager) => {
        // ID 필터링 기준 = 'fragId'
        const { formatResult, ids } = entityFormatter(frags, '_', {
          userId: userId,
        });

        const entity = FragEntity.create(formatResult);

        const data = await this.fragRepository.find({
          select: ['fragId'],
          where: { userId },
          loadRelationIds: false,
        });

        // 현재 사용자의 Timer 인벤토리에 저장된 Timer만을 반영
        const dataToRemove = data.filter((frag) => !ids.includes(frag.fragId));

        // dataToRemove.forEach((frag) => {
        //   this.stacksToFragRepository.delete({ fragId: frag.fragId });
        // });
        if (dataToRemove.length > 0) {
          const stackIds: Set<string> = new Set();

          // 스택 아이디 추출
          for (const frag of dataToRemove) {
            const stacksToFragEntries = await this.stacksToFragRepository.find({
              where: { fragId: frag.fragId },
              relations: ['stacks'],
            });
            const stackId = stacksToFragEntries.map((entry) => entry.stacks.id);
            stackIds.add(stackId[0]);
          }

          await this.stacksToFragRepository
            .createQueryBuilder()
            .delete()
            .where('fragId IN (:...fragIds)', {
              fragIds: dataToRemove.map((f) => f.fragId),
            })
            .execute();

          // 만약 타이머 제거 후 스택에 남아있는 타이머가 없다면 스택도 함께 제거
          for (const stackId of stackIds) {
            // TODO: 찾는 메서드 find로 일치시키기
            const entries = await this.stacksToFragRepository.findBy({
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
