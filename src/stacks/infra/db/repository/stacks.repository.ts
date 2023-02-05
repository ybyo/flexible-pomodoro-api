import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { IGeneralResponse } from '@/type-defs/message.interface';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { entityFormatter } from '@/utils/entity-formatter.util';
import { IStacksRepository } from '@/stacks/domain/istacks.repository';
import { InjectMapper } from '@automapper/nestjs';
import { Stacks } from '@/stacks/domain/stacks.model';
import { DataSource, Repository } from 'typeorm';
import { StacksToFragEntity } from '@/stacks/infra/db/entity/stacks-to-frag.entity';

@Injectable()
export class StacksRepository implements IStacksRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private dataSource: DataSource,
    @InjectRepository(StacksEntity)
    private stackRepository: Repository<StacksEntity>,
    @InjectRepository(StacksToFragEntity)
    private stacksToFragRepository: Repository<StacksToFragEntity>,
  ) {}
  // TODO: 리턴 타입 수정
  async fetchStack(id: string): Promise<any> {
    // TODO: 불필요한 데이터는 리턴하지 않도록 수정
    // TODO: 쿼리결과 order by 'order'
    const stackEntity = await this.stackRepository.find({
      where: { userId: id },
      relations: {
        user: false,
        stacksToFrag: {
          frag: true,
          // TODO: 순환 쿼리 방지하도록 엔티티 수정
          stacks: false,
        },
      },
    });

    // Using query builder
    // const stackEntity = await this.dataSource.manager
    //   .createQueryBuilder(StacksEntity, 'Stacks')
    //   .leftJoinAndSelect('Stacks.stacksToFrag', 'stacksToFrag')
    //   .getMany();

    if (!stackEntity) {
      return null;
    }

    // TODO: Mapper 재정의
    // const stacks = this.mapper.mapArray(stackEntity, StacksEntity, Stacks);
    // console.log(stacks);

    return stackEntity;
  }

  async saveStack(
    userId: string,
    stacks: Stacks,
  ): Promise<IGeneralResponse<void>> {
    try {
      await this.dataSource.transaction(async (manager) => {
        // TODO: 불필요한 프로퍼티 생성 최소화
        // TODO: Mapper 활용하여 내부 데이터 id -> fragId 수행
        const { formatResult, ids } = entityFormatter([stacks], '_', {
          userId: userId,
          stacksToFragId: 'ulid',
        });
        const result = StacksEntity.create(formatResult[0]);

        // 기존에 DB에 저장되어있는 같은 stacksId 관련 정보 제거
        await this.stacksToFragRepository.delete({ stacksId: stacks.id });
        await manager.save(result);
      });
    } catch (err) {
      throw new Error(err);
    }

    const result = {} as IGeneralResponse<void>;

    result.success = true;

    return result;
  }
}
