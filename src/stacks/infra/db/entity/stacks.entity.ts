import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  RelationId,
} from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { StacksToTimerEntity } from '@/stacks/infra/db/entity/stacks-to-timer.entity';

@Entity('Stacks')
export class StacksEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  count: number;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @CreateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.stacks, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @RelationId((stacksEntity: StacksEntity) => stacksEntity.user)
  @Column({ nullable: true, select: false })
  userId: string;

  @OneToMany(
    () => StacksToTimerEntity,
    (stacksToTimer) => stacksToTimer.stacks,
    {
      cascade: true,
    },
  )
  stacksToTimer: StacksToTimerEntity[];
}
