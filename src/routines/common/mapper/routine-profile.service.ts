import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
} from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { Routine } from '@/routines/domain/routine.model';

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
