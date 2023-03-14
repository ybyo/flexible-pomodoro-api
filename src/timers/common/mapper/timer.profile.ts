import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
} from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { TimerEntity } from '@/timers/infra/db/entity/timer.entity';
import { Timer } from '@/timers/domain/timer.model';

@Injectable()
export class TimerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        TimerEntity,
        Timer,
        namingConventions(new CamelCaseNamingConvention()),
      );
    };
  }
}
