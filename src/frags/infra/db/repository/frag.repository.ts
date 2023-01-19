import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';
import { IFragRepository } from '@/frags/domain/ifrag.repository';
import { IGeneralResponse } from '@/type-defs/message.interface';
import { entityFormatter } from '@/utils/entity-formatter.util';

@Injectable()
export class FragRepository implements IFragRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private connection: DataSource,
    @InjectRepository(FragEntity)
    private fragRepository: Repository<FragEntity>,
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

  async saveFrag(
    userId: string,
    frags: Frag[],
  ): Promise<IGeneralResponse<void>> {
    try {
      await this.connection.transaction(async (manager) => {
        const { result, ids } = entityFormatter(frags, '_', { userId: userId });

        const entity = FragEntity.create(result);

        const data = await this.fragRepository.find({
          select: ['id'],
          where: { userId },
          loadRelationIds: false,
        });

        const dataToRemove = data.filter((frag) => !ids.includes(frag.id));

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
