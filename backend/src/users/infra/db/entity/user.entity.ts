import * as argon2 from '@node-rs/argon2';
import {
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
export class UserEntity {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column({ unique: true, length: 320 })
  email: string;

  @Column({ unique: true, length: 39 })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: null })
  signupToken: string;

  @Column({ nullable: true, default: null })
  resetPasswordToken: string;

  @Column({ nullable: true, default: null })
  changeEmailToken: string;

  @Column({ nullable: true, default: null })
  newEmail: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }

  @OneToMany(() => TimerEntity, (timerEntity) => timerEntity.user)
  timer: Timer[];

  @OneToMany(() => RoutineEntity, (routineEntity) => routineEntity.user)
  routine: Routine[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
