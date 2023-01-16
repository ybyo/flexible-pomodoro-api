import { Injectable } from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';
import { IFragRepository } from '@/frags/domain/ifrag.repository';

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
}
