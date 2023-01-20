import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';
import { Stacks } from '@/stacks/domain/stacks.model';

@Entity('Frag')
export class FragEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (userEntity) => userEntity.frag, {
    cascade: true,
  })
  user: UserEntity;

  @RelationId((fragEntity: FragEntity) => fragEntity.user)
  @Column()
  userId: string;

  @ManyToMany(() => StacksEntity, (stacks) => stacks.frags)
  stacks: Stacks[];

  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  duration: number;

  @Column()
  count: number;

  @Column()
  color: string;
}
