import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
} from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';

@Injectable()
export class FragProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        FragEntity,
        Frag,
        namingConventions(new CamelCaseNamingConvention()),
      );
    };
  }
}
