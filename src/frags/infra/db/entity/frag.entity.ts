import { Column, Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

@Entity('Frag')
export class FragEntity {
  @ManyToOne(() => UserEntity, (userEntity) => userEntity.frags)
  user: UserEntity;

  @RelationId((fragEntity: FragEntity) => fragEntity.user)
  userId: string;

  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  duration: number;

  @Column()
  count: number;

  @Column()
  color: string;
}
