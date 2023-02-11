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

@Entity('Frag')
export class FragEntity extends BaseEntity {
  @PrimaryColumn()
  fragId: string;

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

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.frag)
  user: UserEntity;

  @RelationId((fragEntity: FragEntity) => fragEntity.user)
  @Column({ nullable: true, select: false })
  userId: string;

  @OneToMany(() => StacksToFragEntity, (stacksToFrag) => stacksToFrag.frag, {
    cascade: true,
  })
  stacksToFrag: StacksToFragEntity[];
}
