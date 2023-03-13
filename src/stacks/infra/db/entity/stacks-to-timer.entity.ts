import { TimerEntity } from '@/timer/infra/db/entity/timer.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';

@Entity('StacksToTimer')
export class StacksToTimerEntity {
  @PrimaryColumn()
  stacksToTimerId: string;

  @Column({ default: 0 })
  order: number;

  @Column({ select: false })
  timerId: string;

  @Column({ select: false })
  stacksId: string;

  @ManyToOne(() => StacksEntity, (stacks) => stacks.stacksToTimer, {
    createForeignKeyConstraints: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stacksId', referencedColumnName: 'id' })
  stacks: StacksEntity;

  @ManyToOne(() => TimerEntity, (timer) => timer.stacksToTimer, {
    createForeignKeyConstraints: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'timerId', referencedColumnName: 'timerId' })
  timer: TimerEntity;
}
