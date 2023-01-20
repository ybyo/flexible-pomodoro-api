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

@Injectable()
export class StacksRepository implements IStacksRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private connection: DataSource,
    @InjectRepository(StacksEntity)
    private stackRepository: Repository<StacksEntity>,
  ) {}
  async fetchStack(id: string): Promise<Stacks[]> {
    const stackEntity = await this.stackRepository.find({
      // relations: ['user'],
      where: { userId: id },
      loadRelationIds: false,
    });

    if (!stackEntity) {
      return null;
    }

    const stacks = this.mapper.mapArray(stackEntity, StacksEntity, Stacks);

    return stacks;
  }

  async saveStack(
    userId: string,
    stacks: Stacks[],
  ): Promise<IGeneralResponse<void>> {
    try {
      await this.connection.transaction(async (manager) => {
        const { result, ids } = entityFormatter(stacks, '_', {
          userId: userId,
        });

        const entity = StacksEntity.create(result);

        const data = await this.stackRepository.find({
          select: ['id'],
          where: { userId },
          loadRelationIds: false,
        });

        const dataToRemove = data.filter((stacks) => !ids.includes(stacks.id));

        await manager.remove(dataToRemove);
        await manager.save(entity);
      });
    } catch (err) {
      throw new Error(err);
    }

    const result = {} as IGeneralResponse<void>;

    result.success = true;

    return result;
  }
}
