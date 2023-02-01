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
import { StacksToFragEntity } from '@/stacks/infra/db/entity/stacks-to-frag.entity';
import { JoinColumn } from 'typeorm/browser';

@Entity('Stacks')
export class StacksEntity extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.stacks)
  user: UserEntity;

  @RelationId((stacksEntity: StacksEntity) => stacksEntity.user)
  @Column({ nullable: true })
  userId: string;

  @OneToMany(() => StacksToFragEntity, (stacksToFrag) => stacksToFrag.stacks, {
    eager: true,
    cascade: true,
  })
  stacksToFrag: StacksToFragEntity[];
}
