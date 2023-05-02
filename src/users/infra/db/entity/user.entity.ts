import { AutoMap } from '@automapper/classes';
import * as argon2 from 'argon2';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Routine } from '@/routines/domain/routine.model';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { Timer } from '@/timers/domain/timer.model';
import { TimerEntity } from '@/timers/infra/db/entity/timer.entity';

@Entity('User')
export class UserEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({ length: 39 })
  userName: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: null })
  signupToken: string;

  @Column({ nullable: true, default: null })
  resetPasswordToken: string;

  @Column({ default: null })
  changeEmailToken: string;

  @Column({ default: null })
  newEmail: string;

  @Column({ default: null })
  changeEmailTokenCreated: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }

  @AutoMap(() => [Timer])
  @OneToMany(() => TimerEntity, (timerEntity) => timerEntity.user)
  timer: Timer[];

  @AutoMap(() => [Routine])
  @OneToMany(() => RoutineEntity, (routineEntity) => routineEntity.user)
  routine: Routine[];
}
