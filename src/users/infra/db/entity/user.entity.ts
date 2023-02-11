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
import * as argon2 from 'argon2';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';
import { Stacks } from '@/stacks/domain/stacks.model';
import { AutoMap } from '@automapper/classes';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';

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

  @Column()
  signupVerifyToken: string;

  @Column({ type: 'text', default: null })
  refreshToken: string;

  @Column({ default: null })
  resetPasswordToken: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isLoggedin: boolean;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }

  @AutoMap(() => [Frag])
  @OneToMany(() => FragEntity, (fragEntity) => fragEntity.user, {
    cascade: true,
  })
  frag: Frag[];

  @AutoMap(() => [Stacks])
  @OneToMany(() => StacksEntity, (stacksEntity) => stacksEntity.user, {
    cascade: true,
  })
  stacks: Stacks[];
}
