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
import { User } from '@/users/domain/user.model';
import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Frag } from '@/frags/domain/frag.model';
import { AutoMap } from '@automapper/classes';

@Entity('User')
export class UserEntity extends BaseEntity {
  @AutoMap(() => [Frag])
  @OneToMany(() => FragEntity, (fragEntity) => fragEntity.user)
  frag: Frag[];

  @PrimaryColumn()
  id: string;

  @Column({ length: 30 })
  userName: string;

  @Column({ length: 128, unique: true })
  email: string;

  @Column({ length: 128 })
  password: string;

  @Column({ length: 60 })
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

  static toUser(entity: UserEntity) {
    const user = new User({});
    user.id = entity.id;
    user.userName = entity.userName;
    user.email = entity.email;
    user.password = entity.password;
    user.signupVerifyToken = entity.signupVerifyToken;
    user.refreshToken = entity.refreshToken;
    user.resetPasswordToken = entity.resetPasswordToken;
    user.isVerified = entity.isVerified;
    user.isLoggedin = entity.isVerified;
    user.isActive = entity.isVerified;
    return user;
  }
}
