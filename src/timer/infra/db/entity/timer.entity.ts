import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';
import { StacksToTimerEntity } from '@/stacks/infra/db/entity/stacks-to-timer.entity';

@Entity('Timer')
export class TimerEntity extends BaseEntity {
  @PrimaryColumn()
  timerId: string;

  @Column()
  name: string;

  @Column()
  duration: number;

  @Column()
  count: number;

  @Column()
  order: number;

  @Column()
  color: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.timer, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @RelationId((timerEntity: TimerEntity) => timerEntity.user)
  @Column({ nullable: true, select: false })
  userId: string;

  @OneToMany(
    () => StacksToTimerEntity,
    (stacksToTimer) => stacksToTimer.timer,
    {
      cascade: true,
    },
  )
  stacksToTimer: StacksToTimerEntity[];
}
