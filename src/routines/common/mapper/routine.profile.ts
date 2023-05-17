import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { Routine } from '@/routines/domain/routine.model';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';

@Injectable()
export class RoutineProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        RoutineEntity,
        Routine,
        namingConventions(new CamelCaseNamingConvention()),
      );
    };
  }
}
