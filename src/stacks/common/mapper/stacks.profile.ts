import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
} from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { Stacks } from '@/stacks/domain/stacks.model';

@Injectable()
export class StacksProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        StacksEntity,
        Stacks,
        namingConventions(new CamelCaseNamingConvention()),
      );
    };
  }
}
