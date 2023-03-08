import { FragEntity } from '@/frags/infra/db/entity/frag.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { StacksEntity } from '@/stacks/infra/db/entity/stacks.entity';

@Entity('StacksToFrag')
export class StacksToFragEntity {
  @PrimaryColumn()
  stacksToFragId: string;

  @Column({ default: 0 })
  order: number;

  @Column({ select: false })
  fragId: string;

  @Column({ select: false })
  stacksId: string;

  @ManyToOne(() => StacksEntity, (stacks) => stacks.stacksToFrag, {
    createForeignKeyConstraints: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stacksId', referencedColumnName: 'id' })
  stacks: StacksEntity;

  @ManyToOne(() => FragEntity, (frag) => frag.stacksToFrag, {
    createForeignKeyConstraints: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fragId', referencedColumnName: 'fragId' })
  frag: FragEntity;
}
