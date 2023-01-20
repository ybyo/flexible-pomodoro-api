import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { Frag } from '@/frags/domain/frag.model';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';

@Entity('Stacks')
export class StacksEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (userEntity) => userEntity.stacks, {
    cascade: true,
  })
  user: UserEntity;

  @RelationId((stacksEntity: StacksEntity) => stacksEntity.user)
  @Column()
  userId: string;

  @ManyToMany(() => FragEntity, (frag) => frag.stacks)
  @JoinTable()
  frags: Frag[];

  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  count: number;
}
