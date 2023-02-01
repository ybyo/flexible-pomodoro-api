import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';

@Entity('StacksToFrag')
export class StacksToFragEntity {
  @PrimaryColumn()
  stacksToFragId: string;

  @Column({ default: -2 })
  order: number;

  @Column()
  fragId: string;

  @ManyToOne(() => StacksEntity, (stacks) => stacks, {
    createForeignKeyConstraints: false,
  })
  stacks: StacksEntity;

  @ManyToOne(() => FragEntity, (frag) => frag.stacksToFrag, {
    createForeignKeyConstraints: false,
    nullable: false,
  })
  frag: FragEntity;
}
