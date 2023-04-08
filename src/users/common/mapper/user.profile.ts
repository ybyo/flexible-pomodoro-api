import type { Mapper } from '@automapper/core';
import { createMap } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';

import { User } from '@/users/domain/user.model';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(mapper, UserEntity, User);
    };
  }
}
